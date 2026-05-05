import { defineStore } from 'pinia';

export const useShopStore = defineStore('shop', {
  state: () => ({
    testVariable: 'Hello Pinia',
  }),
  
  getters: {
    getTestVariable: (state) => state.testVariable,
  },
  
  actions: {
    setTestVariable(value: string) {
      this.testVariable = value;
    },
  },
});
