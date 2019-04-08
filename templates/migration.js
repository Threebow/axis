module.exports = {
	up: (knex) => {
		return knex.schema.createTable("my_table", (bp) => {
			bp.increments();
			bp.string("name");
			bp.timestamps();
		});
	},

	down: (knex) => {
		return knex.schema.dropTable("my_table");
	}
};