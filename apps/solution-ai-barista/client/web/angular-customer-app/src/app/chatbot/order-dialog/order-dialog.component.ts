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

import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BeverageModel } from "../../../../../../../shared/beverageModel";
import { ErrorResponse } from "../../../../../../../shared/errorResponse";
import { CoffeeService } from "../../services/coffee.service";

@Component({
    selector: 'order-dialog',
    templateUrl: 'order-dialog.component.html',
    styleUrls: ['order-dialog.component.scss'],
    imports: [MatProgressBarModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatButtonModule],
  })
  export class OrderDialog {
    data = inject(MAT_DIALOG_DATA);
    private coffeeService: CoffeeService = inject(CoffeeService);

    order = signal<BeverageModel[]>(this.data.order);
    message = signal<string>(this.data.message);
    error = signal<ErrorResponse | undefined>(undefined);
    loading = signal<boolean>(false);
    isConfirmation = signal<boolean>(this.data.isConfirmation);

    constructor(private dialogRef: MatDialogRef<OrderDialog>){}

    submitOrder() {
      this.dialogRef.close (
        {
        submitOrder: true
        }
      )
  }
}