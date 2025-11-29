const validateCreateSiteUser = (data) => {
  const errors = {};

  // Validate full_name
  if (!data.full_name || !data.full_name.trim()) {
    errors.full_name = 'Full name is required';
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  } else if (data.full_name.trim().length > 50) {
    errors.full_name = 'Full name cannot exceed 50 characters';
  }

  // Validate email
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (
    !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)
  ) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate contact_number
  if (!data.contact_number || !data.contact_number.trim()) {
    errors.contact_number = 'Contact number is required';
  } else if (data.contact_number.trim().length < 10) {
    errors.contact_number = 'Contact number must be at least 10 digits';
  } else if (data.contact_number.trim().length > 15) {
    errors.contact_number = 'Contact number cannot exceed 15 characters';
  }

  // Validate project_name
  if (!data.project_name || !data.project_name.trim()) {
    errors.project_name = 'Project name is required';
  } else if (data.project_name.trim().length < 2) {
    errors.project_name = 'Project name must be at least 2 characters';
  } else if (data.project_name.trim().length > 100) {
    errors.project_name = 'Project name cannot exceed 100 characters';
  }

  // Validate password
  if (!data.password || !data.password.trim()) {
    errors.password = 'Password is required';
  } else if (data.password.trim().length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateUpdateSiteUser = (data) => {
  const errors = {};

  // Validate full_name if provided
  if (data.full_name !== undefined) {
    if (!data.full_name || !data.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (data.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    } else if (data.full_name.trim().length > 50) {
      errors.full_name = 'Full name cannot exceed 50 characters';
    }
  }

  // Validate email if provided
  if (data.email !== undefined) {
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email is required';
    } else if (
      !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)
    ) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Validate contact_number if provided
  if (data.contact_number !== undefined) {
    if (!data.contact_number || !data.contact_number.trim()) {
      errors.contact_number = 'Contact number is required';
    } else if (data.contact_number.trim().length < 10) {
      errors.contact_number = 'Contact number must be at least 10 digits';
    } else if (data.contact_number.trim().length > 15) {
      errors.contact_number = 'Contact number cannot exceed 15 characters';
    }
  }

  // Validate project_name if provided
  if (data.project_name !== undefined) {
    if (!data.project_name || !data.project_name.trim()) {
      errors.project_name = 'Project name is required';
    } else if (data.project_name.trim().length < 2) {
      errors.project_name = 'Project name must be at least 2 characters';
    } else if (data.project_name.trim().length > 100) {
      errors.project_name = 'Project name cannot exceed 100 characters';
    }
  }

  // Validate password if provided
  if (data.password !== undefined) {
    if (!data.password || !data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateCreateSiteUser,
  validateUpdateSiteUser,
};
