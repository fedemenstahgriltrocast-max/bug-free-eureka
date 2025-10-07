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

import express, { Request, Response } from 'express';

const app = express();

const port = process.env.RECOMMENDATION_SERVICE_PORT || 8084;

const favouriteDrinks = ['Moccha', 'Latte', 'Cortado'];
const favouriteModifiers = ['double shots', 'chocolate syrup', 'caramel sauce', 'whipped cream'];


/**
* Demo endpoint that returns a drink recommendation.
* 
* Any combination of a favourite drink and two modifiers makes for a fantastic recommendation!
*/
app.get('/recommendation', (req: Request, res: Response) => {
  // Select a random drink
  const recommendedDrink = favouriteDrinks[Math.floor(Math.random() * favouriteDrinks.length)];

  // Select two random modifiers
  const recommendedModifiers = favouriteModifiers.sort(() => 0.5 - Math.random()).slice(0, 2);

  const recommendation = {
    name: recommendedDrink,
    modifiers: recommendedModifiers,
  };
  console.log(`Returning recommendation:\n${JSON.stringify(recommendation)}`)
  res.send(recommendation);
});


app.listen(port, () => {
  console.log(`Local recommendation service running at http://localhost:${port}`);
})
