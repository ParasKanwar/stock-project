import { getNifty100 } from '../../utils/loadNifty';
export const someFunction = () => {
	getNifty100().then(console.log);
};
