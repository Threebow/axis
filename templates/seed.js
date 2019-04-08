module.exports.seed = async (knex) => {
	//Delete existing entries
	await knex("users").del();

	//Create new users
	await knex("users").insert([
		{
			id: 1,
			email: "user1@mailservice.com",
			password: "hunter2"
		},
		{
			id: 2,
			email: "user2@mailservice.com",
			password: "hunter3"
		},
		{
			id: 3,
			email: "user3@mailservice.com",
			password: "hunter4"
		}
	]);
};