// Potlačení varování od @azure/functions při běhu testů
const originalWarn = console.warn;
console.warn = (...args) => {
    if (typeof args[0] === 'string' && (
        args[0].includes('WARNING: Failed to detect the Azure Functions runtime') ||
        args[0].includes('WARNING: Skipping call to register function') ||
        args[0].includes('WARNING: Skipping call to register')
    )) {
        return;
    }
    originalWarn(...args);
};
