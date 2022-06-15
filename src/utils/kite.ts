import mongoose from 'mongoose';
import { getParametersByPath } from '../parameters/getParameters';
/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { KiteTicker, KiteConnect } from 'kiteconnect';

interface KiteCredentials {
  access_token: string;
  user_id: string;
  api_key: string;
  password: string;
  api_secret: string;
}

class KiteService {
	static kiteConnectInstance: KiteConnect;
	static kiteTickerInstance: KiteTicker;
	static kiteCredentials: KiteCredentials;
	private static getKiteCreds = async (): Promise<KiteCredentials> => {
		if (!this.kiteCredentials) {
			this.kiteCredentials = await this.getKiteCredentials();
		}
		return this.kiteCredentials;
	};
	private static getKiteCredentials = async (): Promise<KiteCredentials> => {
		const kiteConnectPath = '/kiteconnect';
		const { Parameters } = await getParametersByPath({ path: kiteConnectPath });
		const users = (await mongoose.connection.db.collections()).find(({ namespace }) => namespace === 'stocksZerodha.users');
		const user_id = Parameters.find(({ Name }: any) => Name === `${kiteConnectPath}/user_id_1`).Value;
		const api_key = Parameters.find(({ Name }: any) => Name === `${kiteConnectPath}/api_key`).Value;
		const password = Parameters.find(({ Name }: any) => Name === `${kiteConnectPath}/password_1`).Value;
		const api_secret = Parameters.find(({ Name }: any) => Name === `${kiteConnectPath}/api_secret`).Value;
		const data = await users?.findOne({ email: 'paraskanwar30@gmail.com' });
		return { access_token: data?.access_token, user_id, api_key, password, api_secret };
	};
	static async getKiteConnect() {
		if (!KiteService.kiteConnectInstance) {
			const { api_key, access_token } = await this.getKiteCreds();
			KiteService.kiteConnectInstance = new KiteConnect({ api_key, access_token });
		}
		return KiteService.kiteConnectInstance;
	}
	static async getKiteTicker() {
		if (!KiteService.kiteTickerInstance) {
			const { access_token, api_key } = await this.getKiteCreds();
			KiteService.kiteTickerInstance = new KiteTicker({ access_token, api_key });
		}
		return KiteService.kiteTickerInstance;
	}
}

export { KiteService };
