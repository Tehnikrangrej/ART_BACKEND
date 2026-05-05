const prisma = require('../prismaClient');

const generatePermissions = async (app) => {
  const routes = [];
  
  // Recursive function to extract routes from Express app
  const extractRoutes = (stack, parentPath = '') => {
    if (!stack) return;

    stack.forEach((middleware) => {
      if (middleware.route) {
        // Simple route
        const path = (parentPath + middleware.route.path).replace(/\/+/g, '/').replace(/\/$/, '');
        const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
        methods.forEach(method => {
          routes.push({ method, path });
        });
      } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
        // Nested router
        let newParentPath = parentPath;
        if (middleware.regexp) {
          const match = middleware.regexp.toString().match(/^\/\^\\(\/.*?)\\\//);
          if (match && match[1]) {
            newParentPath += match[1];
          }
        }
        extractRoutes(middleware.handle.stack, newParentPath);
      }
    });
  };


  // Force router initialization if it hasn't happened
  if (typeof app.lazyrouter === 'function') {
    app.lazyrouter();
  }

  if (!app._router) {
    console.warn('⚠️ Express router not found. Permission generation skipped.');
    return;
  }

  extractRoutes(app._router.stack);
  console.log(`[DEBUG] Extracted ${routes.length} total routes.`);




  // Filter out auth routes and root routes
  const filteredRoutes = routes.filter(r => 
    !r.path.startsWith('/api/auth') && 
    r.path !== '' && 
    r.path !== '*'
  );

  console.log(`[DEBUG] Found ${filteredRoutes.length} routes for permission generation.`);


  const methodToAction = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };

  for (const route of filteredRoutes) {
    // Extract resource name from path (e.g., /api/artwork/:id -> ARTWORK)
    const pathParts = route.path.split('/').filter(p => p && p !== 'api' && !p.startsWith(':'));
    const resource = pathParts.length > 0 ? pathParts[0].toUpperCase() : 'GENERAL';
    const action = methodToAction[route.method] || 'READ';
    
    // Construct permission name: ACTION_RESOURCE (e.g., READ_ARTWORK)
    const name = `${action}_${resource}`;

    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        name,
        action,
        resource
      }
    });
  }

  console.log('✅ Dynamic permissions synchronized with database.');
};

module.exports = generatePermissions;
