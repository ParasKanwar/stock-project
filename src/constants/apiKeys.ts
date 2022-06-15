import mongoose from 'mongoose';

const getAccessTokenKite = async (): Promise<string | undefined | null> => {
	const users = (await mongoose.connection.db.collections()).find(({ namespace }) => namespace === 'stocks_zerodha.users');
	const data = await users?.findOne({ email: 'paraskanwar30@gmail.com' });
	return data?.access_token;
};

module.exports = {
	getAccessTokenKite,
};







