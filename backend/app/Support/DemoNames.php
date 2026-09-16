<?php

namespace App\Support;

final class DemoNames
{
    public const NOMBRES_M = [
        'Andrés', 'Carlos', 'Luis', 'Jorge', 'Diego', 'Pablo', 'Marco', 'Fernando', 'Ricardo', 'Javier',
        'Esteban', 'Byron', 'Wilson', 'Édgar', 'Iván', 'Patricio', 'Christian', 'Fabián', 'Galo', 'Milton',
        'Santiago', 'Mateo', 'Sebastián', 'Bryan', 'Kevin', 'Josué', 'Alexis', 'Darwin', 'Hernán', 'Rubén',
    ];

    public const NOMBRES_F = [
        'María', 'Ana', 'Verónica', 'Gabriela', 'Paola', 'Silvia', 'Jessica', 'Karina', 'Mónica', 'Daniela',
        'Andrea', 'Cristina', 'Lorena', 'Mayra', 'Elizabeth', 'Johanna', 'Tatiana', 'Diana', 'Alexandra', 'Nathaly',
        'Valeria', 'Doménica', 'Sofía', 'Carolina', 'Belén', 'Erika', 'Gissela', 'Rocío', 'Yolanda', 'Marcia',
    ];

    public const APELLIDOS = [
        'Andrade', 'Cevallos', 'Chávez', 'Cedeño', 'Zambrano', 'Vera', 'Mendoza', 'Villacís', 'Guerrero', 'Paredes',
        'Salazar', 'Jaramillo', 'Aguilar', 'Sánchez', 'Ramírez', 'Torres', 'Castillo', 'Moreira', 'Bravo', 'Loor',
        'Pazmiño', 'Tapia', 'Benítez', 'Espinoza', 'Cabrera', 'Ortega', 'Herrera', 'Suárez', 'Lucero', 'Naranjo',
        'Yépez', 'Quishpe', 'Chimbo', 'Tituaña', 'Morocho', 'Caiza', 'Guamán', 'Pilataxi', 'Chicaiza', 'Toapanta',
        'Vallejo', 'Arteaga', 'Cárdenas', 'Rosero', 'Montalvo', 'Escobar', 'Lascano', 'Peñafiel', 'Zurita', 'Carrión',
    ];

    public const MOTIVOS_CONSULTA = [
        'Cefalea', 'Lumbalgia', 'Gripe / resfriado común', 'Dolor abdominal', 'Control de presión arterial',
        'Curación de herida', 'Conjuntivitis', 'Gastritis', 'Faringitis', 'Contractura muscular',
        'Control post-incapacidad', 'Chequeo pre-ocupacional', 'Dermatitis de contacto', 'Esguince de tobillo',
        'Quemadura leve', 'Corte superficial en mano', 'Fatiga visual', 'Control de glucosa',
    ];

    public const MOTIVOS_CONSULTA_LABORAL = [
        'Quemadura leve', 'Corte superficial en mano', 'Contractura muscular', 'Esguince de tobillo',
        'Dermatitis de contacto', 'Lumbalgia', 'Fatiga visual',
    ];

    public const CIE10 = [
        'Cefalea' => 'R51', 'Lumbalgia' => 'M54.5', 'Gripe / resfriado común' => 'J00',
        'Dolor abdominal' => 'R10', 'Control de presión arterial' => 'I10', 'Curación de herida' => 'Z48.0',
        'Conjuntivitis' => 'H10', 'Gastritis' => 'K29', 'Faringitis' => 'J02', 'Contractura muscular' => 'M62.4',
        'Control post-incapacidad' => 'Z09', 'Chequeo pre-ocupacional' => 'Z10.0',
        'Dermatitis de contacto' => 'L23', 'Esguince de tobillo' => 'S93.4', 'Quemadura leve' => 'T30.0',
        'Corte superficial en mano' => 'S61.0', 'Fatiga visual' => 'H53.1', 'Control de glucosa' => 'E11',
    ];
}
