const HOME = process.env.HOME;
import path from 'path';

function loadConfig(generator, refresh) {
  let data = global.DATA ? global.DATA : generator.config.getAll();
  if (refresh) {
    data = {};
  }

  return new Promise((resolve) => resolve(data));
}

export function filterData(allowed) {
  return (data) => {
    const ret = {};
    allowed.forEach((key) => {
      if (key in data) {
        ret[key] = data[key];
      }
    });
    return new Promise((resolve) => resolve(ret));
  };
}

function getPromptedFields(data, required) {
  const ret = [];
  required.forEach((key) => {
    if (!(key in data)) {
      ret.push(key);
    }
  });

  return ret;
}

function prompt(data, promptKeys, generator, resolve) {
  const schema = {
    projectName() {
      return {
        type: 'prompt',
        name: 'projectName',
        message: 'Project name:',
      };
    },
    shortName(data) {
      return {
        type: 'prompt',
        name: 'shortName',
        message: 'Project short name:',
        default: data.projectName
      };
    },
    projectType() {
      return {
        type: 'list',
        name: 'projectType',
        message: 'Type of project:',
        choices: ['shell', 'javascript'],
      };
    },
    isGithub() {
      return {
        type: 'confirm',
        name: 'isGithub',
        message: 'Publish on github?',
      };
    },
    isBabel() {
      return {
        type: 'confirm',
        name: 'isBabel',
        message: 'Use babel.js?',
      };
    },
    isEslint() {
      return {
        type: 'confirm',
        name: 'isEslint',
        message: 'Use eslint?',
      };
    },
    description() {
      return {
        type: 'prompt',
        name: 'description',
        message: 'Description:',
        default: '',
      };
    },
  };
  const key = promptKeys.shift();
  if (key) {
    generator.prompt([schema[key](data)]).then((props) => {
      const nextData = {
        ...data,
        ...props
      };
      prompt(nextData, promptKeys, generator, resolve);
    });
  } else {
    resolve(data);
  }
}

function promptRequired(required, generator) {
  return (data) => {
    const promptKeys = getPromptedFields(data, required);

    return new Promise((resolve) => {
      prompt(data, promptKeys, generator, resolve);
    });
  };
}

export default function config(generator, options, refresh) {
  return new Promise((resolve) => {
    loadConfig(generator, refresh)
      .then(promptRequired(options, generator))
      .then((data) => {
        generator.props = data; //eslint-disable-line no-param-reassign
        generator.destinationRoot(path.join(HOME, 'src', data.projectName));
        generator.config.set(data);
        generator.config.save();
        global.DATA = data;
        resolve(data);
      });
  });
}
