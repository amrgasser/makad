'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {

  async search(ctx) {

    let entities;

    const { searchString } = ctx.params

    if (ctx.query._q) {
      entities = await strapi.services.unit.search(ctx.query);
    } else {
      entities = await strapi.services.unit.find(ctx.query);
    }
    const units = entities.filter((entity) => {
      if (entity.zoneName.toLowerCase().includes(searchString)) return true
      if (entity.unitName.toLowerCase().includes(searchString)) return true
      if (entity.unit_type.name.toLowerCase().includes(searchString)) return true
    })

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.unit }));
  }
};
