import { Injectable, NotFoundException } from 'next-js-backend';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    { id: '1', name: 'Widget A', price: 9.99, category: 'widgets' },
    { id: '2', name: 'Gadget B', price: 49.99, category: 'gadgets' },
  ];

  findAll(category?: string): Product[] {
    return category ? this.products.filter(p => p.category === category) : [...this.products];
  }

  findOne(id: string): Product {
    const p = this.products.find(p => p.id === id);
    if (!p) throw new NotFoundException(`Product #${id} not found`);
    return p;
  }

  create(data: Omit<Product, 'id'>): Product {
    const p = { id: crypto.randomUUID(), ...data };
    this.products.push(p);
    return p;
  }
}
