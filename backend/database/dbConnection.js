import mongoose from "mongoose";

export const dbConnection = async () => {
  const dbName =
    process.env.MONGO_DB_NAME || "MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM_DEPLOYED";

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName,
    });
    console.log(`Connected to database (${dbName})!`);
  } catch (err) {
    console.error("Some error occured while connecting to database:", err);
    throw err;
  }
};
