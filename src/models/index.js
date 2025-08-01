/**
 * Simple Customer model for DataStore
 * Keeps implementation straightforward as per user preferences
 */
export class Customer {
  constructor(init) {
    Object.assign(this, init);
  }
  
  static copyOf(source, mutator) {
    const copy = new Customer(source);
    return mutator(copy);
  }
}
