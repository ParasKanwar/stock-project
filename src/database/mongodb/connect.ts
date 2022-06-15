import mongoose from 'mongoose';
import { getParametersByPath } from '../../parameters/getParameters';
import { mongo_parameters_path } from '../../constants/ssm';

const connect = async () => {
	const { Parameters } = await getParametersByPath({ path: mongo_parameters_path });
	const username = Parameters.find(({ Name }: any) => Name === '/mongo_db/username').Value;
	const password = Parameters.find(({ Name }: any) => Name === '/mongo_db/password').Value;
	const db_name = Parameters.find(({ Name }: any) => Name === '/mongo_db/stocks_zerodha').Value;
	await mongoose.connect(
		`mongodb+srv://${username}:${password}@cluster0.7pnto.mongodb.net/${db_name}?retryWrites=true&w=majority`
	);
};

export { connect };
