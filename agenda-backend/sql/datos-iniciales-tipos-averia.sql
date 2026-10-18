USE agendaletric;

INSERT INTO tipo_averia (nombre)
SELECT catalogo.nombre
FROM (
    SELECT 'Falla del sistema eléctrico' AS nombre
    UNION ALL SELECT 'Falla del sistema electrónico'
    UNION ALL SELECT 'Problema de arranque'
    UNION ALL SELECT 'Problema de carga o alternador'
    UNION ALL SELECT 'Problema de batería'
    UNION ALL SELECT 'Falla de iluminación'
    UNION ALL SELECT 'Falla de sensores'
    UNION ALL SELECT 'Problema de cableado o conexiones'
    UNION ALL SELECT 'Otro problema'
) AS catalogo
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_averia existente
    WHERE existente.nombre = catalogo.nombre
);
