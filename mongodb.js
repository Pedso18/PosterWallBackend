const { MongoClient } = require("mongodb");

const uri =
	"mongodb+srv://tutty:Tutty575163@tuttyschest.yte5y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const dbName = "Rabbit_Hole";

const client = new MongoClient(uri, { useUnifiedTopology: true });

async function connect(callback) {
	client.connect(function (err) {
		console.log("connected to data base!");
		callback(err);
	});
}

async function ListDataBases() {
	//displays the whole database

	const databasesList = await client.db().admin().listDatabases();

	console.log("DataBases: ");
	databasesList.databases.forEach(db => {
		console.log(`- ${db.name}`);
	});
}

async function createOrUpdateRoom(room) {
	const result = await client
		.db(dbName)
		.collection("Rooms")
		.updateOne({ path: room.path }, { $set: room }, { upsert: true });

	return await findRoom(room.path);
}

async function addPostIt(postIt, roomPath) {
	const room = await findRoom(roomPath);
	const xPosGroup = postIt.position.x - (postIt.position.x % 100);

	const y = postIt.position.y;
	const x = postIt.position.x;
	const height = postIt.size.height;
	const width = postIt.size.width;

	for (let i = 0; i < room.postIts.length; i++) {
		// room.postIts = [{x: 0, postIts: [....]}, {x: 100, postIts: [.....]}]
		if (xPosGroup == room.postIts[i].x) {
			console.log(room.postIts[i]);
			let group = room.postIts[i].postIts;

			for (let a = 0; a < group.length; a++) {
				// making sure that it does not collide with anything

				if (
					!(
						y + height < group[a].position.y ||
						y > group[a].position.y + group[a].size.height ||
						x + width < group[a].position.x ||
						x > group[a].position.x + group[a].size.width
					)
				) {
					console.log("it was gonna collide!");
					return { success: false, updatedRoom: room };
				}
			}

			if (x % 100 > 100 - width) {
				for (let i = 0; i < room.postIts.length; i++) {
					// room.postIts = [{x: 0, postIts: [....]}, {x: 100, postIts: [.....]}]
					if (xPosGroup + 100 == room.postIts[i].x) {
						console.log(room.postIts[i]);
						let group = room.postIts[i].postIts;

						for (let a = 0; a < group.length; a++) {
							// making sure that it does not collide with anything

							if (
								!(
									y + height < group[a].position.y ||
									y > group[a].position.y + group[a].size.height ||
									x + width < group[a].position.x ||
									x > group[a].position.x + group[a].size.width
								)
							) {
								console.log("it was gonna collide!");
								return { success: false, updatedRoom: room };
							}
						}

						if (x % 100 < 20) {
						}

						console.log("postIt added!");
						room.postIts[i].postIts.push(postIt);
						return { success: true, updatedRoom: await createOrUpdateRoom(room) };
					}
				}
			}

			console.log("postIt added!");
			room.postIts[i].postIts.push(postIt);
			return { success: true, updatedRoom: await createOrUpdateRoom(room) };
		}
	}

	room.postIts.push({ x: xPosGroup, postIts: [postIt] });
	return { success: true, updatedRoom: await createOrUpdateRoom(room) };
}

async function createListings(newListings, collectionName) {
	const result = await client
		.db(dbName)
		.collection(collectionName)
		.insertMany(newListings);

	console.log(`new document created with the following id: ${result.insertedId}`);
}

async function findRoom(roomPath) {
	const result = await client
		.db(dbName)
		.collection("Rooms")
		.findOne({ path: roomPath });

	if (result) {
		return result;
	} else {
		return { path: roomPath, postIts: [{ x: 0, postIts: [] }] };
	}
}

async function findAccount(username, password) {
	try {
		const result = await client
			.db(dbName)
			.collection("Users")
			.findOne({ username, password });

		if (!result) {
			console.log("nothing found");
			return false;
		}

		console.log("found");
		return result;
	} catch (err) {
		console.error(err);
		return false;
	}
}

async function createAccount(username, password) {
	const doesAccountExist = async () => {
		try {
			const result = await client
				.db(dbName)
				.collection("Users")
				.findOne({ username });

			if (!result) {
				console.log("nothing found");
				return false;
			}

			console.log("found");
			return true;
		} catch (err) {
			console.error(err);
			return -1;
		}
	};

	try {
		if ((await doesAccountExist(username, password)) === false) {
			const result = await client.db(dbName).collection("Users").insertOne({
				username,
				password,
				savedRooms: [],
				inventory: [],
				superPostIts: 0,
			});

			console.log(`new document created with _id = ${result.insertedId}`);

			return true;
		} else {
			return false;
		}
	} catch (err) {
		console.error(err);
		return false;
	}
}

async function findAllDocs(collectionName) {
	// finds all docs

	const result = await client
		.db(dbName)
		.collection(collectionName)
		.find({})
		.toArray();

	return result;
}

async function updateAccount(user) {
	const result = await client
		.db(dbName)
		.collection("Users")
		.updateOne(
			{ username: user.username, password: user.password },
			{
				$set: {
					username: user.username,
					password: user.password,
					savedRooms: user.savedRooms,
					superPostIts: user.superPostIts,
				},
			},
			{ upsert: false }
		);

	return result;
}

module.exports = {
	connect,
	ListDataBases,
	createOrUpdateRoom,
	createListings,
	findRoom,
	findAllDocs,
	addPostIt,
	findAccount,
	createAccount,
	updateAccount,
};
