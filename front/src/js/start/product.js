import { ProductControler } from '../controler/ProductControler';
import { CONFIG } from '../config/config';

let controler = new ProductControler(CONFIG);

controler.initialize();
