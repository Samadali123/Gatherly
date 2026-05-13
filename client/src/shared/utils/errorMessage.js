const fieldLabels = {
  email: 'Email',
  password: 'Password',
  name: 'Name',
  question: 'Question',
  options: 'Options',
  maxParticipants: 'Max participants',
};

const friendlyByMessage = {
  'Invalid credentials': 'Email or password is incorrect.',
  'Email already registered': 'This email is already registered. Please sign in instead.',
  'Refresh token missing': 'Please sign in to continue.',
  'Invalid or missing token': 'Please sign in to continue.',
  'Validation failed': 'Please check the highlighted details and try again.',
  'Room expired': 'This room has ended.',
  'Resource not found': 'We could not find what you are looking for.',
};

const technicalPatterns = [
  /prisma/i,
  /database/i,
  /public\./i,
  /does not exist/i,
  /invocation/i,
  /sql/i,
  /postgres/i,
  /constraint/i,
  /schema/i,
  /stack/i,
  /aggregateerror/i,
  /econnrefused|etimedout|eacces|enotfound/i,
];

const friendlyForTechnicalMessage = (message = '') => {
  if (!technicalPatterns.some((pattern) => pattern.test(message))) {
    return '';
  }

  if (/users.*does not exist|table.*does not exist|database is not ready/i.test(message)) {
    return 'The app database is not ready yet. Please try again after setup is complete.';
  }

  return 'Something went wrong on our side. Please try again in a moment.';
};

const normalizeValidationMessage = (field, message = '') => {
  const text = message.replaceAll('"', '').replace(field || '', '').trim();
  const lower = text.toLowerCase();

  if (field === 'email' || lower.includes('email')) {
    if (lower.includes('valid') || lower.includes('format')) {
      return 'Please enter a valid email address.';
    }
  }

  if (field === 'password') {
    if (lower.includes('8') || lower.includes('length') || lower.includes('min')) {
      return 'Password must be at least 8 characters.';
    }
    if (lower.includes('required') || lower.includes('empty')) {
      return 'Please enter your password.';
    }
  }

  if (field === 'name') {
    if (lower.includes('required') || lower.includes('empty')) {
      return 'Please enter your full name.';
    }
  }

  if (lower.includes('required') || lower.includes('empty')) {
    return `${fieldLabels[field] || 'This field'} is required.`;
  }

  return text || 'Please check this field.';
};

export const getFriendlyErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const response = error?.response?.data;
  const firstError = response?.errors?.[0];

  if (firstError) {
    const field = fieldLabels[firstError.field] || firstError.field;
    const message = normalizeValidationMessage(firstError.field, firstError.message);
    return field ? `${field}: ${message}` : message;
  }

  const message = response?.message || error?.message;
  return friendlyByMessage[message] || friendlyForTechnicalMessage(message) || message || fallback;
};
