/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const attributes = ['Amazing', 'Spectacular', 'Wonderful', 'Fantastic', 'Incredible', 'Outstanding', 'Exceptional', 'Marvelous', 'Terrific', 'Phenomenal'];
const animals = ['Aardvark', 'Badger', 'Capybara', 'Dingo', 'Emu', 'Ferret', 'Giraffe', 'Hippopotamus', 'Iguana', 'Jaguar', 'Kangaroo', 'Lion', 'Meerkat', 'Narwhal', 'Ostrich', 'Penguin', 'Quail', 'Rhinoceros', 'Snake', 'Tiger', 'Unicorn', 'Vaquita', 'Wallaby', 'Xenoceratops', 'Yak', 'Zebra'];

/**
 * Generate a random name consisting of an attribute and an animal. 
 * @returns Random name
 */
export function generateName(): string {
    const attribute = attributes[Math.floor(Math.random() * attributes.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${attribute} ${animal}`;
}