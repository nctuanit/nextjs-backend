import { BadRequestException } from './src/exceptions';

const err = new BadRequestException('Validation failed: "abc" is not an integer');
console.log(JSON.stringify(err.getResponse(), null, 2));

const err2 = new BadRequestException({ custom: 'object' });
console.log(JSON.stringify(err2.getResponse(), null, 2));
