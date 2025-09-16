export async function validateInput(model: string, type: string, data: any, schemas: any) {
  const modelName = model.charAt(0).toUpperCase() + model.slice(1);
  const schemaMap: Record<string, string> = {
    CreateInput: `${modelName}CreateInputObjectSchema`,
    UpdateInput: `${modelName}UpdateInputObjectSchema`,
    // ... rest of mappings
  };

  const schemaName = schemaMap[type];
  
  if (!schemaName) {
    throw new Error(`No schema mapping for type: ${type} (Model: ${model})`);
  }

  const schema = schemas[schemaName];
  
  if (!schema) {
    throw new Error(`Schema ${schemaName} not found (Model: ${model})`);
  }

  return await schema.parseAsync(data);
}