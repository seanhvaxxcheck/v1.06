import { supabase } from '../lib/supabase';

// Default categories and conditions
export const DEFAULT_CATEGORIES = [
];

export const DEFAULT_CONDITIONS = [
];

export const DEFAULT_SUBCATEGORIES = [
];
// Interface for custom field data from the database function
export interface CustomField {
  id: string;
  field_name: string;
  field_type: 'category' | 'condition' | 'subcategory';
  is_active: boolean;
  user_id: string;
}

// Get all active custom fields for a user using the database function
export const getActiveCustomFields = async (userId: string): Promise<CustomField[]> => {
  const { data, error } = await supabase
    .rpc('fn_active_custom_fields', { p_user_id: userId });

  if (error) {
    console.error('Error fetching active custom fields:', error);
    return [];
  }

  return data || [];
};

// Get categories using the new function
export const getCustomCategories = async (userId: string): Promise<string[]> => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'category')
    .filter(field => field.is_active === true)
    .map(field => field.field_name);
};

// Get conditions using the new function
export const getCustomConditions = async (userId: string): Promise<string[]> => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'condition')
    .filter(field => field.is_active === true)
    .map(field => field.field_name);
};

// Get subcategories using the new function
export const getCustomSubcategories = async (userId: string): Promise<string[]> => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'subcategory')
    .filter(field => field.is_active === true)
    .map(field => field.field_name);
};
// Get category ID by name
export const getCategoryIdByName = async (name: string, userId: string): Promise<string | null> => {
  // First check if it's a default category
  const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.name === name);
  if (defaultCategory) {
    return defaultCategory.id;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const category = fields.find(field => field.field_type === 'category' && field.field_name === name  && field.is_active === true);
  return category?.id || null;
};

// Get condition ID by name
export const getConditionIdByName = async (name: string, userId: string): Promise<string | null> => {
  // First check if it's a default condition
  const defaultCondition = DEFAULT_CONDITIONS.find(cond => cond.name === name);
  if (defaultCondition) {
    return defaultCondition.id;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const condition = fields.find(field => field.field_type === 'condition' && field.field_name === name  && field.is_active === true);
  return condition?.id || null;
};

// Get subcategory ID by name
export const getSubcategoryIdByName = async (name: string, userId: string): Promise<string | null> => {
  // First check if it's a default subcategory
  const defaultSubcategory = DEFAULT_SUBCATEGORIES.find(sub => sub.name === name);
  if (defaultSubcategory) {
    return defaultSubcategory.id;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const subcategory = fields.find(field => field.field_type === 'subcategory' && field.field_name === name && field.is_active === true);
  return subcategory?.id || null;
};
// Get category name by ID
export const getCategoryNameById = async (id: string, userId: string): Promise<string> => {
  // First check if it's a default category
  const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.id === id);
  if (defaultCategory) {
    return defaultCategory.name;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const category = fields.find(field => field.field_type === 'category' && field.id === id  && field.is_active === true);
  return category?.field_name || id;
};

// Get condition name by ID
export const getConditionNameById = async (id: string, userId: string): Promise<string> => {
  // First check if it's a default condition
  const defaultCondition = DEFAULT_CONDITIONS.find(cond => cond.id === id);
  if (defaultCondition) {
    return defaultCondition.name;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const condition = fields.find(field => field.field_type === 'condition' && field.id === id && field.is_active === true);
  return condition?.field_name || id;
};

// Get subcategory name by ID
export const getSubcategoryNameById = async (id: string, userId: string): Promise<string> => {
  // First check if it's a default subcategory
  const defaultSubcategory = DEFAULT_SUBCATEGORIES.find(sub => sub.id === id);
  if (defaultSubcategory) {
    return defaultSubcategory.name;
  }
  
  // Then check custom fields
  const fields = await getActiveCustomFields(userId);
  const subcategory = fields.find(field => field.field_type === 'subcategory' && field.id === id && field.is_active === true);
  return subcategory?.field_name || id;
};
// Synchronous versions for components that need immediate access
export const getAllCategoriesSync = (customFields: CustomField[] = []) => {
  const customCategories = customFields
    .filter(field => field.field_type === 'category')
    .filter(field => field.is_active === true)
    .map(field => ({ id: field.id, name: field.field_name }));
  
  // Combine default categories with custom ones
  return [...DEFAULT_CATEGORIES, ...customCategories];
};

export const getAllConditionsSync = (customFields: CustomField[] = []) => {
  const customConditions = customFields
    .filter(field => field.field_type === 'condition')
    .filter(field => field.is_active === true)
    .map(field => ({ id: field.id, name: field.field_name }));
  
  // Combine default conditions with custom ones
  return [...DEFAULT_CONDITIONS, ...customConditions];
};

export const getAllSubcategoriesSync = (customFields: CustomField[] = []) => {
  const customSubcategories = customFields
    .filter(field => field.field_type === 'subcategory')
    .filter(field => field.is_active === true)
    .map(field => ({ id: field.id, name: field.field_name }));
  
  // Combine default subcategories with custom ones
  return [...DEFAULT_SUBCATEGORIES, ...customSubcategories];
};
// Async versions that use the database function
export const getAllCategories = async (userId: string) => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'category')
        .filter(field => field.is_active === true)

    .map(field => ({ id: field.id, name: field.field_name }));
};

export const getAllConditions = async (userId: string) => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'condition')
        .filter(field => field.is_active === true)

    .map(field => ({ id: field.id, name: field.field_name }));
};

// Async versions that use the database function
export const getAllSubcategories = async (userId: string) => {
  const fields = await getActiveCustomFields(userId);
  return fields
    .filter(field => field.field_type === 'subcategory')
    .filter(field => field.is_active === true)
    .map(field => ({ id: field.id, name: field.field_name }));
};
// Database operations for custom fields
export const addCustomCategory = async (categoryName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .insert({
      user_id: userId,
      field_type: 'category',
      field_name: categoryName,
      is_active: true,
    });

  if (error) {
    console.error('Error adding custom category:', error);
    return { error: error.message };
  }

  return {};
};

export const addCustomCondition = async (conditionName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .insert({
      user_id: userId,
      field_type: 'condition',
      field_name: conditionName,
      is_active: true,
    });

  if (error) {
    console.error('Error adding custom condition:', error);
    return { error: error.message };
  }

  return {};
};

export const addCustomSubcategory = async (subcategoryName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .insert({
      user_id: userId,
      field_type: 'subcategory',
      field_name: subcategoryName,
      is_active: true,
    });

  if (error) {
    console.error('Error adding custom subcategory:', error);
    return { error: error.message };
  }

  return {};
};
export const removeCustomCategory = async (categoryName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('field_type', 'category')
    .eq('field_name', categoryName);

  if (error) {
    console.error('Error removing custom category:', error);
    return { error: error.message };
  }

  return {};
};

export const removeCustomCondition = async (conditionName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('field_type', 'condition')
    .eq('field_name', conditionName);

  if (error) {
    console.error('Error removing custom condition:', error);
    return { error: error.message };
  }

  return {};
};

export const removeCustomSubcategory = async (subcategoryName: string, userId: string) => {
  const { error } = await supabase
    .from('user_custom_fields')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('field_type', 'subcategory')
    .eq('field_name', subcategoryName);

  if (error) {
    console.error('Error removing custom subcategory:', error);
    return { error: error.message };
  }

  return {};
};
// Save multiple custom categories at once
export const saveCustomCategories = async (categories: string[], userId?: string): Promise<{ error?: string }> => {
  if (!userId) return { error: 'User not authenticated' };
  
  try {
    // First, deactivate all existing custom categories
    await supabase
      .from('user_custom_fields')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('field_type', 'category');

    // Then insert the new categories
    if (categories.length > 0) {
      const categoryData = categories.map(categoryName => ({
        user_id: userId,
        field_type: 'category',
        field_name: categoryName,
        is_active: true,
      }));

      const { error } = await supabase
        .from('user_custom_fields')
        .insert(categoryData);

      if (error) {
        console.error('Error saving custom categories:', error);
        return { error: error.message };
      }
    }

    return {};
  } catch (error: any) {
    console.error('Error saving custom categories:', error);
    return { error: error.message };
  }
};

// Save multiple custom conditions at once
export const saveCustomConditions = async (conditions: string[], userId?: string): Promise<{ error?: string }> => {
  if (!userId) return { error: 'User not authenticated' };
  
  try {
    // First, deactivate all existing custom conditions
    await supabase
      .from('user_custom_fields')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('field_type', 'condition');

    // Then insert the new conditions
    if (conditions.length > 0) {
      const conditionData = conditions.map(conditionName => ({
        user_id: userId,
        field_type: 'condition',
        field_name: conditionName,
        is_active: true,
      }));

      const { error } = await supabase
        .from('user_custom_fields')
        .insert(conditionData);

      if (error) {
        console.error('Error saving custom conditions:', error);
        return { error: error.message };
      }
    }

    return {};
  } catch (error: any) {
    console.error('Error saving custom conditions:', error);
    return { error: error.message };
  }
};

// Save multiple custom subcategories at once
export const saveCustomSubcategories = async (subcategories: string[], userId?: string): Promise<{ error?: string }> => {
  if (!userId) return { error: 'User not authenticated' };
  
  try {
    // First, deactivate all existing custom subcategories
    await supabase
      .from('user_custom_fields')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('field_type', 'subcategory');

    // Then insert the new subcategories
    if (subcategories.length > 0) {
      const subcategoryData = subcategories.map(subcategoryName => ({
        user_id: userId,
        field_type: 'subcategory',
        field_name: subcategoryName,
        is_active: true,
      }));

      const { error } = await supabase
        .from('user_custom_fields')
        .insert(subcategoryData);

      if (error) {
        console.error('Error saving custom subcategories:', error);
        return { error: error.message };
      }
    }

    return {};
  } catch (error: any) {
    console.error('Error saving custom subcategories:', error);
    return { error: error.message };
  }
};
// Additional exports that might be needed by components
export const getDeletedDefaultCategories = async (userId: string): Promise<string[]> => {
  // This function would return default categories that the user has "deleted" or hidden
  // For now, returning empty array as this functionality isn't implemented in the database
  return [];
};

// Synchronous version for components that need immediate access
export const getDeletedDefaultCategoriesSync = (): string[] => {
  // Return empty array since this functionality isn't implemented
  return [];
};

export const getDeletedDefaultConditions = async (userId: string): Promise<string[]> => {
  // This function would return default conditions that the user has "deleted" or hidden
  // For now, returning empty array as this functionality isn't implemented in the database
  return [];
};

// Synchronous version for components that need immediate access
export const getDeletedDefaultConditionsSync = (): string[] => {
  // Return empty array since this functionality isn't implemented
  return [];
};

export const saveDeletedDefaultCategories = async (deletedCategories: string[], userId: string): Promise<{ error?: string }> => {
  // This function would save which default categories the user has "deleted" or hidden
  // For now, returning success as this functionality isn't implemented in the database
  console.log('saveDeletedDefaultCategories called with:', deletedCategories, userId);
  return { error: undefined };
};

export const saveDeletedDefaultConditions = async (deletedConditions: string[], userId: string): Promise<{ error?: string }> => {
  // This function would save which default conditions the user has "deleted" or hidden
  // For now, returning success as this functionality isn't implemented in the database
  console.log('saveDeletedDefaultConditions called with:', deletedConditions, userId);
  return { error: undefined };
};

// Legacy/compatibility exports
export const getDefaultCategories = () => DEFAULT_CATEGORIES;
export const getDefaultConditions = () => DEFAULT_CONDITIONS;

// Additional compatibility exports that might be needed
export const getAvailableCategories = (customCategories: string[] = [], deletedDefaults: string[] = []) => {
  const defaultNames = DEFAULT_CATEGORIES.map(cat => cat.name).filter(name => !deletedDefaults.includes(name));
  return [...defaultNames, ...customCategories];
};

export const getAvailableConditions = (customConditions: string[] = [], deletedDefaults: string[] = []) => {
  const defaultNames = DEFAULT_CONDITIONS.map(cond => cond.name).filter(name => !deletedDefaults.includes(name));
  return [...defaultNames, ...customConditions];
};