import { Firestore } from '@google-cloud/firestore';

class FirestoreProvider {
  private firestoreInstance: Firestore;

  private constructor() {
    this.firestoreInstance = new Firestore();
  }

  get firestore(): Firestore {
    return this.firestoreInstance;
  }

  private static instance: FirestoreProvider;

  static get(): FirestoreProvider {
    if (!FirestoreProvider.instance) {
      FirestoreProvider.instance = new FirestoreProvider();
    }

    return FirestoreProvider.instance;
  }
}

export default FirestoreProvider;
