import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FichesClients {
  id?: string,
  start: any;
  end: any;
  fullName: string;
  identityCard: string;
  identityCard2: string;
  conclude: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class FichesClientsService {

  private fichesClientsCollection: AngularFirestoreCollection<FichesClients>;
  private fichesClients: Observable<FichesClients[]>;

  constructor(
      db: AngularFirestore
  ) { 
    this.fichesClientsCollection = db.collection<FichesClients>('fichesClients');

    this.fichesClients = this.fichesClientsCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        });
      })
    );
  }

  getFichesClients(){
    return this.fichesClients;
  }

  getFicheClient(id: any){
    return this.fichesClientsCollection.doc<FichesClients>(id).valueChanges();
  }

  updateFicheClient(ficheClient: FichesClients, id: string){
    return this.fichesClientsCollection.doc(id).update(ficheClient);
  }

  addFicheClient(ficheClient: FichesClients){
    return this.fichesClientsCollection.add(ficheClient);
  }

  removeFicheClient(id: any){
    return this.fichesClientsCollection.doc(id).delete();
  }


}
