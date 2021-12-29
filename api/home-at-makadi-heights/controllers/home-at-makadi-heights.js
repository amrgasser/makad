'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  masterPlan: async (ctx) => {
    let amenities; let zones;
    if (ctx.query._q) {
      zones = await strapi.services.zones.search(ctx.query);
      amenities = await strapi.services.amenity.search(ctx.query);
    } else {
      zones = await strapi.services.zones.find(ctx.query);
      amenities = await strapi.services.amenity.find(ctx.query);
    }
    let masterPlan = { zones, amenities }
    return masterPlan;
  }
};
