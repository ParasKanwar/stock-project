/* eslint-disable @typescript-eslint/no-var-requires */
import AWS from 'aws-sdk';
import fs from 'fs';
import path_node from 'path';
import { Logger } from 'sitka';

const getParametersByPath = async ({ region = 'ap-south-1', path }: { region?: string; path: string }) => {
	const cachedLocation = path_node.join(__dirname, '../../data/parameters_by_path');
	if (!fs.existsSync(cachedLocation)) {
		Logger.getLogger().info('Downloading Parameters from SSM');
		fs.mkdirSync(cachedLocation, { recursive: true });
		const ssm = new AWS.SSM({ region });
		const returnValue = await ssm.getParametersByPath({ Path: path }).promise();
		fs.writeFileSync(`${cachedLocation}/${path}.json`, JSON.stringify(returnValue, null, 2));
		return returnValue;
	} else {
		Logger.getLogger().info('Loading Parameters from Cache');
		const returnValue = JSON.parse(fs.readFileSync(`${cachedLocation}/${path}.json`).toString());
		return returnValue;
	}
};

export { getParametersByPath };
