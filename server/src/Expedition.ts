import { DocumentData, QueryDocumentSnapshot } from '@google-cloud/firestore';

export class Expedition {
  constructor(
    readonly id: string,
    readonly description: string,
    readonly from: string,
    readonly image: string,
    readonly name: string,
    readonly timezone: string,
    readonly to: string,
    readonly travelFrom: string,
    readonly travelTo: string,
  ) {}
}

export const expeditionConverter = {
  toFirestore(expedition: Expedition): DocumentData {
    return {
      description: expedition.description,
      from: expedition.from,
      image: expedition.image,
      name: expedition.name,
      timezone: expedition.timezone,
      to: expedition.to,
      travelFrom: expedition.travelFrom,
      travelTo: expedition.travelTo,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Expedition {
    const data = snapshot.data();
    return new Expedition(
      snapshot.id,
      data.description,
      data.from,
      data.image,
      data.name,
      data.timezone,
      data.to,
      data.travelFrom,
      data.travelTo,
    );
  },
};
