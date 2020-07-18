export default class Expedition {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public image: string,
    public from: string,
    public to: string,
    public timezone: string,
  ) {}
};
