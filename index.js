const fs = require('fs');

/**
 * Establece una variable de salida (output) para GitHub Actions.
 * Escribe en el archivo definido por la variable de entorno GITHUB_OUTPUT.
 */
function setOutput(key, value) {
  const outputFilePath = process.env.GITHUB_OUTPUT;
  if (outputFilePath) {
    fs.appendFileSync(outputFilePath, `${key}=${value}\n`);
  } else {
    console.log(`[OUTPUT] ${key}: ${value}`);
  }
}

function run() {
  try {
    // Obtener los inputs del workflow. GitHub Actions pasa los inputs como variables de entorno con el prefijo INPUT_
    const branchName = process.env['INPUT_BRANCH-NAME'] || process.env['INPUT_BRANCH_NAME'] || '';
    const regexStr = process.env['INPUT_REGEX'] || '^(feature|bugfix|hotfix|release)\\/([a-zA-Z0-9]+-[0-9]+)-.+';
    const failOnError = (process.env['INPUT_FAIL-ON-ERROR'] || process.env['INPUT_FAIL_ON_ERROR'] || 'true').toLowerCase() === 'true';

    console.log('=====================================================');
    console.log('       INICIANDO BRANCH NAMING VALIDATOR             ');
    console.log('=====================================================');
    console.log(`Rama a validar: "${branchName}"`);
    console.log(`Expresión regular: "${regexStr}"`);
    console.log(`Fallar en caso de error (fail-on-error): ${failOnError}`);
    console.log('-----------------------------------------------------');

    // Gestión de inputs vacíos (Parte 5: Robustez)
    if (!branchName) {
      const errorMsg = 'El nombre de la rama no se ha proporcionado (input "branch-name" vacío).';
      console.log(`::warning::${errorMsg}`);
      
      setOutput('is-valid', 'false');
      setOutput('prefix', '');
      setOutput('ticket-id', '');
      setOutput('summary', errorMsg);
      
      if (failOnError) {
        process.exitCode = 1;
        throw new Error(errorMsg);
      }
      return;
    }

    // Compilación de expresión regular
    let regex;
    try {
      regex = new RegExp(regexStr);
    } catch (e) {
      const errorMsg = `La expresión regular provista es inválida: ${e.message}`;
      console.log(`::error::${errorMsg}`);
      
      setOutput('is-valid', 'false');
      setOutput('prefix', '');
      setOutput('ticket-id', '');
      setOutput('summary', errorMsg);
      
      process.exitCode = 1;
      throw new Error(errorMsg);
    }

    // Ejecución de la validación
    const match = branchName.match(regex);

    if (match) {
      // Si hay grupos de captura, intentamos extraerlos de forma dinámica
      // match[1] suele ser el prefijo de rama y match[2] el ID del ticket en la regex por defecto
      const prefix = match[1] || 'N/A';
      const ticketId = match[2] || 'N/A';
      const summary = `Validación exitosa: La rama "${branchName}" sigue el patrón. Tipo: "${prefix}", Ticket: "${ticketId}".`;
      
      console.log(`¡Éxito! La rama cumple con el patrón establecido.`);
      console.log(`-> Tipo de rama (Prefix): "${prefix}"`);
      console.log(`-> ID del Ticket (Ticket-ID): "${ticketId}"`);
      console.log('-----------------------------------------------------');

      setOutput('is-valid', 'true');
      setOutput('prefix', prefix);
      setOutput('ticket-id', ticketId);
      setOutput('summary', summary);
    } else {
      const summary = `El nombre de la rama "${branchName}" no cumple con el patrón requerido: "${regexStr}".`;
      console.log(`::warning::${summary}`);
      console.log('-----------------------------------------------------');

      setOutput('is-valid', 'false');
      setOutput('prefix', '');
      setOutput('ticket-id', '');
      setOutput('summary', summary);

      if (failOnError) {
        process.exitCode = 1;
        throw new Error(summary);
      }
    }
  } catch (error) {
    console.log(`::error::[Fallo Controlado] ${error.message}`);
    process.exitCode = 1;
  }
}

run();
