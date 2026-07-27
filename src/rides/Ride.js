export class Ride {
  constructor({ id, type, name, tx, ty, footprint, price, excitement, intensity, nausea,
                cost, animated = false, animSpeed = 0 }) {
    this.id         = id;
    this.type       = type;
    this.name       = name;
    this.tx         = tx;
    this.ty         = ty;
    this.footprint  = footprint.map(f => ({ ...f }));
    this.price      = price;
    this.excitement = excitement;
    this.intensity  = intensity;
    this.nausea     = nausea;
    this.cost       = cost;
    this.animated   = animated;
    this.animSpeed  = animSpeed;
    this.status     = 'OPEN';   // OPEN | CLOSED | BROKEN
    this.riderCount = 0;
    this.incomeTotal = 0;
    this.animAngle  = 0;
  }
}
