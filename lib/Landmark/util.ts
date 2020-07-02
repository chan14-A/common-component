interface Vector {
  x: number;
  y: number;
}

export function crossMul(v1: Vector, v2: Vector) {
  return v1.x * v2.y - v1.y * v2.x;
}

// p1 p2 为一条线段 p3 p4 为一条线段
export function checkIntersect(p1: Vector, p2: Vector, p3: Vector, p4: Vector) {
  let v1 = { x: p1.x - p3.x, y: p1.y - p3.y };
  let v2 = { x: p2.x - p3.x, y: p2.y - p3.y };
  let v3 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const v = crossMul(v1, v3) * crossMul(v2, v3);
  v1 = { x: p3.x - p1.x, y: p3.y - p1.y };
  v2 = { x: p4.x - p1.x, y: p4.y - p1.y };
  v3 = { x: p2.x - p1.x, y: p2.y - p1.y };
  return v <= 0 && crossMul(v1, v3) * crossMul(v2, v3) <= 0 ? true : false;
}
