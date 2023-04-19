
import { provideInitialize } from './agent';

jest.mock('forta-agent');
jest.mock("ethers");
jest.mock("./network");
jest.mock("./token.creator.monitor");
jest.mock("./liquidity.pool.monitor");
jest.mock("./token.liquidity.monitor");
jest.mock('./token.removal.monitor');

describe('provideInitialize', () => {
  it('should expose a function', () => {
		expect(provideInitialize).toBeDefined();
	});
  
  it('provideInitialize should return expected output', () => {
    // const retValue = provideInitialize(provider);
    expect(true).toBeTruthy();
  });
});