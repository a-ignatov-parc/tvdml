export default class CustomNode {
  constructor(Constructor, lifecycle) {
    this.Constructor = Constructor;
    this.lifecycle = lifecycle;
  }

  toNode(payload) {
    const { Constructor, lifecycle } = this;
    return new Constructor(payload, lifecycle);
  }
}
