var term = require('terminal-kit').terminal;
var fs = require('fs');

var config = {
  extension: null,
  models: {},
  namespace: { vendor: null, extension: null },
};

function save() {
  let data = JSON.stringify(config);
  fs.writeFileSync(config.namespace.extension + '.json', data);
}

function createModel() {
  term.clear();
  var fieldTypes = ['String', 'Integer', 'Float'];

  term('\nEnter the model name: ');
  term.inputField(function (error, modelName) {
    config.models[modelName] = { name: modelName, fields: [] };
    term('\nField Name: ');
    term.inputField(function (error, fieldName) {
      term.gridMenu(fieldTypes, function (error, response) {
        let type = response.selectedText;

        config.models[modelName].fields.push({ name: fieldName, type: type });
        showMenu();
      });
    });
  });
}

function editField(modelName, fieldName) {
  var items = ['Edit Name', 'Edit Type'];
  items.push('< Back');
  term.clear();

  term.singleColumnMenu(items, function (error, response) {
    if (response.selectedText == '< Back') return editFields(modelName);
    var editField = response.selectedText;
  });
}

function editFields(modelName) {
  var items = [];

  config.models[modelName].fields.forEach((field) => {
    items.push(field.name + ' (' + field.type + ')');
  });

  items.push('< Back');

  term.clear();

  term.singleColumnMenu(items, function (error, response) {
    var fieldName = response.selectedText;

    if (response.selectedText == '< Back') return editModel();
    editField(modelName, fieldName);
  });
}

function editModel() {
  var items = [];
  term.clear();

  Object.keys(config.models).forEach((name) => {
    items.push(name);
  });

  items.push('< Back');

  term.clear();

  term.singleColumnMenu(items, function (error, response) {
    var modelName = response.selectedText;
    if (response.selectedText == '< Back') return showMenu();

    editFields(modelName);
  });
}

function exportExtensionModel(model) {
  var attributes = '';
  var methods = '';

  model.fields.forEach((field) => {
    let name = field.name.toLowerCase();
    let type = field.type.toLowerCase();

    attributes += `

		/**
		 * @var ${type}
	 	*/
		protected  $${name} = '';`;

    methods += `
	
		/**
		 * @param ${type} $${name}
		 * @return void
		 */
		public function set${field.name}($${name})
		{
			$this->${name} = $${name};
		}

		/**
		 * @return ${type}
		 */
		public function get${field.name}()
		{
			return $this->${name};
		}`;
  });

  var content = `<?php

namespace ${config.namespace.vendor}\\${config.namespace.extension}\\Domain\\Model;
	
class ${model.name} extends \\TYPO3\\CMS\\Extbase\\DomainObject\\AbstractEntity
	{
	
		/**
		 * @var bool
		 */
		protected  $hidden = true;
		${attributes}
	
		/**
		 * @return void
		 */
		protected function initStorageObjects()
		{
		}

		${methods}
	}`;

  fs.writeFileSync(
    config.extension + 'Classes/Domain/Model/' + model.name + '.php',
    content
  );
}

function exportExtension() {
  Object.keys(config.models).forEach((name) => {
    exportExtensionModel(config.models[name]);
  });

  showMenu(true);
}

function showMenu(extLoaded) {
  term.clear();
  if (extLoaded) {
    var items = ['Create Model'];
  } else {
    var items = ['Load Extension', 'Create Model'];
  }

  if (Object.keys(config.models).length != 0)
    items.push('Edit Model') &&
      items.push('Save Extension') &&
      items.push('Export Extension');

  items.push('< Back');

  term.singleColumnMenu(items, function (error, response) {
    if (response.selectedText == '< Back') return showStart();
    if (response.selectedText == 'Create Model') createModel();
    if (response.selectedText == 'Edit Model') editModel();
    if (response.selectedText == 'Save Extension') save();
    if (response.selectedText == 'Export Extension') exportExtension();
  });
}

function setNamespace() {
  term.clear();
  term('Enter the extension name: ');
  term.inputField(function (error, input) {
    config.extension = input;
    term('Enter the vendor name: ');
    term.inputField(function (error, input) {
      config.namespace.vendor = input;

      term('\nEnter the extension name: ');
      term.inputField(function (error, input) {
        config.namespace.extension = input;

        showMenu();
      });
    });
  });
}

function load() {
  term.clear();
  term('Choose a config file: ');

  term.fileInput({ baseDir: './' }, function (error, input) {
    if (error) {
      term.red.bold('\nAn error occurs: ' + error + '\n');
    } else {
      fs.readFile(input, (err, data) => {
        if (err) throw err;
        config = JSON.parse(data);
        loaded = true;
        showMenu(true);
      });
    }
  });
}

function showStart() {
  var items = ['Load Extension', 'Create Extension'];

  term.clear();

  term.singleColumnMenu(items, function (error, response) {
    if (response.selectedText == 'Create Extension') setNamespace();
    if (response.selectedText == 'Load Extension') load();
  });
}

showStart();

term.on('key', function (name, matches, data) {
  if (name === 'CTRL_C') {
    term.grabInput(false);
    setTimeout(function () {
      process.exit();
    }, 100);
  }
});
