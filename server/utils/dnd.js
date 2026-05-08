const isUserInDnd = (user, now = new Date()) => {
  if (!user || !user.dndEnabled) {
    return false;
  }

  const from = user.dndPeriod?.from ? new Date(user.dndPeriod.from) : null;
  const to = user.dndPeriod?.to ? new Date(user.dndPeriod.to) : null;

  if (!from || !to) {
    return true;
  }

  return now >= from && now < to;
};

module.exports = {
  isUserInDnd,
};
