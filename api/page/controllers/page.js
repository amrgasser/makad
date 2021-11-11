"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */
  find: async (ctx) => {
    console.log("enterfind");
    const entities = await strapi.query("page").model.fetchAll({});
    const zones = await strapi
      .query("zones")
      .model.fetchAll({ columns: ["id", "zoneName"] });
    // ctx.send(entities);
    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.page })
    );
  },
};
