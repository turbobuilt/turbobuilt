<script lang="ts" setup>
import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import type * as monaco from 'monaco-editor-core';
import {
	createTypeScriptWorkerService,
	ServiceEnvironment,
	activateAutomaticTypeAcquisition,
} from '@volar/monaco/worker';
import * as ts from 'typescript';
import { create as createTypeScriptService } from 'volar-service-typescript';

self.onmessage = () => {
	worker.initialize((ctx: monaco.worker.IWorkerContext) => {
		const env: ServiceEnvironment = {
			workspaceFolder: 'file:///',
			typescript: {
				uriToFileName: uri => uri.substring('file://'.length),
				fileNameToUri: fileName => 'file://' + fileName,
			},
		};
		activateAutomaticTypeAcquisition(env);
		return createTypeScriptWorkerService({
			typescript: ts,
			compilerOptions: {
				// ...
			},
			workerContext: ctx,
			env,
			languagePlugins: [
				// ...
			],
			servicePlugins: [
				// ...
				createTypeScriptService(ts),
			],
		});
	});
};

import editorWorker from 'monaco-editor-core/esm/vs/editor/editor.worker?worker';
// import myWorker from './my-lang.worker?worker';

(self as any).MonacoEnvironment = {
	getWorker(_: any, label: string) {
		// if (label === 'my-lang') {
		// 	return new myWorker();
		// }
		return new editorWorker();
	}
}

import type { LanguageService } from '@volar/language-service';
import { editor, languages, Uri } from 'monaco-editor-core';
import { activateMarkers, activateAutoInsertion, registerProviders } from '@volar/monaco';

languages.register({ id: 'my-lang', extensions: ['.my-lang'] });

languages.onLanguage('my-lang', () => {
	const worker = editor.createWebWorker<LanguageService>({
		moduleId: 'vs/language/my-lang/myLangWorker',
		label: 'my-lang',
	});
	activateMarkers(
		worker,
		['my-lang'],
		'my-lang-markers-owner',
		// sync files
		() => [Uri.file('/Foo.my-lang'), Uri.file('/Bar.my-lang')],
		editor
	);
	// auto close tags
	activateAutoInsertion(
		worker,
		['my-lang'],
		// sync files
		() => [Uri.file('/Foo.my-lang'), Uri.file('/Bar.my-lang')],
		editor
	);
	registerProviders(worker, ['my-lang'], languages)
});
</script>
<template>
    <div class="monaco-vue">

    </div>
</template>
<style lang="scss">
.monaco-vue {

}
</style>