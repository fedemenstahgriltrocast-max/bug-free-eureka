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

import { Injectable, inject, signal } from '@angular/core';

import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { MediaModel } from '../../../../../../shared/chatMessageModel';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root',
})
export class MediaStorageService {
    private loginService: LoginService = inject(LoginService);
    private storage = inject(Storage);
    media = signal<MediaModel | null>(null);

    // Upload the file to Cloud Storage for Firebase and return the its storage URL.
    uploadMedia(mediaFile: File): Promise<MediaModel> {
        // Get the user's uid and construct a storage reference.
        const uid = this.loginService.uid();
        const storageRef = ref(this.storage, `/users/${uid}/media/${mediaFile.name}`);
        //TODO: Consider switching to uploadBytesResumable and adding user feedback.
        return uploadBytes(storageRef, mediaFile).then((snapshot) => {
            console.log('Uploaded image', storageRef.fullPath);
            return getDownloadURL(storageRef).then((url) => {
                let media = {
                    storageUrl: snapshot.ref.toString(),
                    contentType: mediaFile.type,
                    downloadUrl: url
                }
                this.media.set(media)
                return media
            });
            
        })
    }

}