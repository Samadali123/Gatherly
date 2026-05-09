const prisma = require('../configs/prisma');

const arrayFields = new Set(['users', 'hiddenFor', 'readBy', 'dndWhitelist']);
const modelMap = {
  anonMessage: 'anonMessage',
  anonParticipant: 'anonParticipant',
  anonPoll: 'anonPoll',
  anonRoom: 'anonRoom',
  call: 'call',
  group: 'group',
  message: 'message',
  password_reset_token: 'passwordResetToken',
  poll: 'poll',
  reaction: 'reaction',
  status: 'status',
  user: 'user',
};

const idOf = (value) => (value && typeof value === 'object' && value._id ? value._id : value);
const toArray = (value) => (Array.isArray(value) ? value.map(idOf) : [idOf(value)]);

const normalizeData = (data = {}) => {
  const normalized = { ...data };
  if (normalized._id) {
    normalized.id = normalized._id;
    delete normalized._id;
  }
  Object.keys(normalized).forEach((key) => {
    if (arrayFields.has(key)) {
      normalized[key] = toArray(normalized[key]).filter(Boolean);
    } else if (normalized[key] && typeof normalized[key] === 'object' && normalized[key]._id) {
      normalized[key] = normalized[key]._id;
    }
  });
  return normalized;
};

const attachDocumentHelpers = (delegate, row) => {
  if (!row) return row;

  const doc = { ...row, _id: row.id };
  doc.toObject = () => {
    const { save, populate, toObject, ...plain } = doc;
    return { ...plain };
  };
  doc.save = async () => {
    const { _id, id, save, populate, toObject, createdAt, updatedAt, ...rest } = doc;
    const saved = await delegate.update({
      where: { id: id || _id },
      data: normalizeData(rest),
    });
    return attachDocumentHelpers(delegate, saved);
  };
  doc.populate = async (path) => populateDoc(doc, path);
  return doc;
};

const populateUser = async (id) => {
  if (!id) return null;
  return attachDocumentHelpers(prisma.user, await prisma.user.findUnique({ where: { id: idOf(id) } }));
};

const populateDoc = async (doc, path) => {
  if (!doc) return doc;
  if (path.includes('users') && Array.isArray(doc.users)) {
    doc.users = (await Promise.all(doc.users.map(populateUser))).filter(Boolean);
  }
  if (path.includes('userId') && doc.userId && typeof doc.userId === 'string') {
    doc.userId = await populateUser(doc.userId);
  }
  if (path.includes('pinnedBy') && doc.pinnedBy && typeof doc.pinnedBy === 'string') {
    doc.pinnedBy = await populateUser(doc.pinnedBy);
  }
  if (path.includes('callerId') && doc.callerId && typeof doc.callerId === 'string') {
    doc.callerId = await populateUser(doc.callerId);
  }
  if (path.includes('receiverId') && doc.receiverId && typeof doc.receiverId === 'string') {
    doc.receiverId = await populateUser(doc.receiverId);
  }
  return doc;
};

const transformCondition = (field, value) => {
  if (field === '_id') field = 'id';

  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    if ('$in' in value) {
      return arrayFields.has(field)
        ? { [field]: { hasSome: toArray(value.$in) } }
        : { [field]: { in: toArray(value.$in) } };
    }
    if ('$ne' in value) {
      return arrayFields.has(field)
        ? { NOT: { [field]: { has: idOf(value.$ne) } } }
        : { [field]: { not: idOf(value.$ne) } };
    }
    if ('$gt' in value) return { [field]: { gt: value.$gt } };
    if ('$lte' in value) return { [field]: { lte: value.$lte } };
    if ('$regex' in value) return { [field]: { contains: value.$regex, mode: value.$options?.includes('i') ? 'insensitive' : 'default' } };
  }

  return { [field]: idOf(value) };
};

const transformFilter = (filter = {}) => {
  const parts = [];
  Object.entries(filter).forEach(([field, value]) => {
    if (field === '$or') {
      parts.push({ OR: value.map(transformFilter) });
      return;
    }
    const condition = transformCondition(field, value);
    if (condition.NOT) {
      parts.push(condition);
    } else {
      parts.push(condition);
    }
  });
  return parts.length > 1 ? { AND: parts } : parts[0] || {};
};

const transformUpdate = (update = {}) => {
  if (update.$set && Object.keys(update).length === 1) return normalizeData(update.$set);
  if (update.$push) {
    const data = {};
    Object.entries(update.$push).forEach(([field, value]) => {
      data[field] = { push: normalizeData(value) };
    });
    return data;
  }
  if (update.$addToSet) {
    const data = {};
    Object.entries(update.$addToSet).forEach(([field, value]) => {
      data[field] = { push: idOf(value) };
    });
    return data;
  }
  return normalizeData(update);
};

class Query {
  constructor(delegate, action, args = {}) {
    this.delegate = delegate;
    this.action = action;
    this.args = args;
    this.populates = [];
  }

  select() {
    return this;
  }

  sort(sortSpec) {
    this.args.orderBy = Object.entries(sortSpec).map(([key, direction]) => ({
      [key === '_id' ? 'id' : key]: direction === -1 ? 'desc' : 'asc',
    }));
    return this;
  }

  limit(value) {
    this.args.take = value;
    return this;
  }

  populate(path) {
    this.populates.push(path);
    return this;
  }

  async exec() {
    const result = await this.delegate[this.action](this.args);
    const wrap = (row) => attachDocumentHelpers(this.delegate, row);
    const wrapped = Array.isArray(result) ? result.map(wrap) : wrap(result);
    if (this.populates.length) {
      if (Array.isArray(wrapped)) {
        for (const doc of wrapped) {
          for (const path of this.populates) await populateDoc(doc, path);
        }
      } else {
        for (const path of this.populates) await populateDoc(wrapped, path);
      }
    }
    return wrapped;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const createModel = (name) => {
  const delegate = prisma[modelMap[name]];

  return {
    create: async (data) => attachDocumentHelpers(delegate, await delegate.create({ data: normalizeData(data) })),
    find: (filter = {}) => new Query(delegate, 'findMany', { where: transformFilter(filter) }),
    findOne: (filter = {}) => new Query(delegate, 'findFirst', { where: transformFilter(filter) }),
    findById: (id) => new Query(delegate, 'findUnique', { where: { id: idOf(id) } }),
    findByIdAndUpdate: (id, update) => new Query(delegate, 'update', { where: { id: idOf(id) }, data: transformUpdate(update) }),
    findOneAndUpdate: (filter, update, options = {}) => {
      if (options.upsert) {
        const where = transformFilter(filter);
        const first = async () => {
          const existing = await delegate.findFirst({ where });
          return existing
            ? delegate.update({ where: { id: existing.id }, data: transformUpdate(update) })
            : delegate.create({ data: normalizeData(update) });
        };
        return { then: (resolve, reject) => first().then((row) => attachDocumentHelpers(delegate, row)).then(resolve, reject) };
      }
      const run = async () => {
        const existing = await delegate.findFirst({ where: transformFilter(filter) });
        if (!existing) return null;
        const row = await delegate.update({ where: { id: existing.id }, data: transformUpdate(update) });
        return attachDocumentHelpers(delegate, row);
      };
      return { then: (resolve, reject) => run().then(resolve, reject), catch: (reject) => run().catch(reject) };
    },
    findOneAndDelete: async (filter) => {
      const existing = await delegate.findFirst({ where: transformFilter(filter) });
      return existing ? attachDocumentHelpers(delegate, await delegate.delete({ where: { id: existing.id } })) : null;
    },
    findByIdAndDelete: async (id) => attachDocumentHelpers(delegate, await delegate.delete({ where: { id: idOf(id) } })),
    deleteMany: (filter = {}) => delegate.deleteMany({ where: transformFilter(filter) }),
    deleteOne: async (filter = {}) => {
      const existing = await delegate.findFirst({ where: transformFilter(filter) });
      return existing ? delegate.delete({ where: { id: existing.id } }) : null;
    },
    updateMany: (filter = {}, update = {}) => delegate.updateMany({ where: transformFilter(filter), data: transformUpdate(update) }),
    countDocuments: (filter = {}) => delegate.count({ where: transformFilter(filter) }),
    aggregate: async (pipeline = []) => {
      const match = pipeline.find((stage) => stage.$match)?.$match || {};
      const rows = await delegate.findMany({ where: transformFilter(match) });
      const groupId = pipeline.find((stage) => stage.$group)?.$group?._id?.replace('$', '');
      if (!groupId) return [];
      const grouped = new Map();
      rows.forEach((row) => grouped.set(row[groupId], (grouped.get(row[groupId]) || 0) + 1));
      return Array.from(grouped.entries()).map(([_id, count]) => ({ _id, count }));
    },
  };
};

module.exports = createModel;
