import csv2json from 'csvtojson';
import { KiteService } from '../utils/kite';
import path from 'path';
import fs from 'fs';

export const getNifty50 = async () => {
	if (!fs.existsSync(path.resolve(__dirname, '../../data/nifty50.json'))) {
		return csv2json()
			.fromFile(path.join(__dirname, '../../data/nifty50.csv'))
			.then((data) => data.map(({ Symbol }) => `NSE:${Symbol}`))
			.then((data) =>
				KiteService.getKiteConnect()
					.then((kc) => kc.getQuote(data))
					.then((data) => Object.keys(data).map((key) => ({ instrument_token: data[key].instrument_token, symbol: key })))
			)
			.then((data) => {
				fs.writeFileSync(path.resolve(__dirname, '../../data/nifty50.json'), JSON.stringify(data));
				return data;
			});
	} else {
		return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/nifty50.json'), { encoding: 'utf8' }));
	}
};

export const getNifty100 = async () => {
	if (!fs.existsSync(path.resolve(__dirname, '../../data/nifty100.json'))) {
		return csv2json()
			.fromFile(path.join(__dirname, '../../data/nifty100.csv'))
			.then((data) => data.map(({ Symbol }) => `NSE:${Symbol}`))
			.then((data) =>
				KiteService.getKiteConnect()
					.then((kc) => kc.getQuote(data))
					.then((data) => Object.keys(data).map((key) => ({ instrument_token: data[key].instrument_token, symbol: key })))
			)
			.then((data) => {
				fs.writeFileSync(path.resolve(__dirname, '../../data/nifty100.json'), JSON.stringify(data));
				return data;
			});
	} else {
		return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/nifty100.json'), { encoding: 'utf8' }));
	}
};



