// AXIOM SUITE - REPORT GENERATOR ENGINE v16.0 MASTER FINAL
// AUTOR: JESUS MUÑOZ TRIGUERO - PROTECCION CIVIL MALAGA - 2026
// REVISIÓN: ARQUITECTO SENIOR - DESGLOSE ATÓMICO DE TODOS LOS CAMPOS

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const generateAuditPDF = async (data) => {
    // --- 1. FORMATEADOR DE FECHA ---
    const formatTimestamp = (ts) => {
        if (!ts) return "---";
        let date;
        if (ts.seconds) { date = new Date(ts.seconds * 1000); }
        else if (ts instanceof Date) { date = ts; }
        else { date = new Date(ts); }
        return isNaN(date.getTime()) ? String(ts) : date.toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // --- 2. MOTOR DE EVIDENCIAS (4:3) ---
    let photosHtml = "";
    if (data.fotos && data.fotos.length > 0) {
        for (let i = 0; i < data.fotos.length; i += 2) {
            const f1 = data.fotos[i];
            const f2 = data.fotos[i + 1];
            const base64_1 = await FileSystem.readAsStringAsync(f1.uri, { encoding: 'base64' });
            let img2Html = "";
            if (f2) {
                const base64_2 = await FileSystem.readAsStringAsync(f2.uri, { encoding: 'base64' });
                img2Html = `<div class="photo-box"><img src="data:image/jpeg;base64,${base64_2}" /><p class="caption">${f2.caption}</p></div>`;
            }
            photosHtml += `<div class="photo-row"><div class="photo-box"><img src="data:image/jpeg;base64,${base64_1}" /><p class="caption">${f1.caption}</p></div>${img2Html}</div>`;
        }
    }

    // --- 3. LÓGICA DE MATRICES (Mantenida por éxito operativo) ---
    const calculateSum = (arr, key) => {
        if (!arr || !Array.isArray(arr)) return 0;
        return arr.reduce((acc, curr) => acc + (parseInt(curr[key]) || 0), 0);
    };

    const renderMatrix = (arr, prefix, title, isVestuario = false) => {
        if (!arr || arr.length === 0) return '';
        const rows = arr.map((item, idx) => `
            <tr>
                <td style="font-weight:bold; background:#F9F9F9;">${prefix}-${idx + 1}</td>
                <td>${isVestuario ? (item.taq || '0') : (item.n || '0')}</td>
                <td>${item.i || '0'}</td>
                <td>${item.u || '0'}</td>
                <td>${item.l || '0'}</td>
                <td>${item.d || '0'}</td>
                <td>${item.pmr || '0'}</td>
                ${isVestuario ? `<td>${item.acc || '0'}</td>` : ''}
            </tr>`).join('');

        return `
            <div class="matrix-unit">
                <p class="matrix-title">${title}</p>
                <table>
                    <thead>
                        <tr><th>ZONA</th><th>${isVestuario?'TAQ':'CANT'}</th><th>INOD</th><th>URIN</th><th>LAV</th><th>DUC</th><th>PMR</th>${isVestuario?'<th>ACC</th>':''}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr class="total-row">
                            <td>Σ</td>
                            <td>${calculateSum(arr, isVestuario ? 'taq' : 'n')}</td>
                            <td>${calculateSum(arr, 'i')}</td>
                            <td>${calculateSum(arr, 'u')}</td>
                            <td>${calculateSum(arr, 'l')}</td>
                            <td>${calculateSum(arr, 'd')}</td>
                            <td>${calculateSum(arr, 'pmr')}</td>
                            ${isVestuario ? `<td>${calculateSum(arr, 'acc')}</td>` : ''}
                        </tr>
                    </tbody>
                </table>
            </div>`;
    };

    // --- 4. PLANTILLA HTML CON DESGLOSE ATÓMICO ---
    const html = `
    <html>
    <head>
        <style>
            @page { margin: 12mm; }
            body { font-family: 'Helvetica'; color: #1a1a1a; font-size: 9.5px; margin: 0; padding: 0; line-height: 1.2; }
            table.master-layout { width: 100%; border: none; border-collapse: collapse; }
            thead.master-header { display: table-header-group; }
            
            .header-container {
                padding-bottom: 40px;
                border-bottom: 5px solid #FF9500;
                margin-bottom: 20px;
                background: white;
            }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-end; }
            .center-name { font-size: 28px; font-weight: 900; color: #000; text-transform: uppercase; margin: 4px 0; letter-spacing: -1.2px; }
            .axiom-brand { color:#FF9500; font-weight:900; font-size: 12px; margin:0; }
            
            .section-title { background: #F2F2F7; padding: 12px; margin-top: 25px; font-weight: bold; text-transform: uppercase; border-left: 6px solid #FF9500; font-size: 11px; }
            .data-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 5px; }
            .data-table td { border: 1px solid #E5E5EA; padding: 8px; text-align: left; vertical-align: middle; }
            .label { font-weight: bold; width: 25%; background: #FAFAFA; color: #666; font-size: 8px; text-transform: uppercase; }
            .val { font-weight: bold; color: #000; font-size: 10px; }
            
            .matrix-wrapper { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-top: 15px; }
            .matrix-unit { width: 49%; page-break-inside: avoid; margin-bottom: 15px; }
            .matrix-unit table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
            .matrix-unit th { background: #F2F2F7; font-weight: bold; padding: 5px; border: 1px solid #E5E5EA; }
            .matrix-unit td { border: 1px solid #E5E5EA; padding: 5px; text-align: center; }
            .matrix-title { font-weight: bold; margin-bottom: 5px; color: #007AFF; font-size: 9px; text-transform: uppercase; }
            .total-row { background: #F2F2F7; font-weight: bold; color: #FF9500; }
            
            .photo-row { display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid; }
            .photo-box { width: 48.5%; border: 1px solid #E5E5EA; border-radius: 12px; padding: 10px; text-align: center; }
            .photo-box img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; }
            .caption { font-weight: bold; color: #FF9500; margin-top: 10px; font-size: 11px; text-transform: uppercase; }
        </style>
    </head>
    <body>
        <table class="master-layout">
            <thead class="master-header">
                <tr><td>
                    <div class="header-container">
                        <div class="header-flex">
                            <div style="width: 70%;">
                                <p class="axiom-brand">AXIOMDATA - ZONAS SEGURAS</p>
                                <div class="center-name">${data.nombre || 'SIN NOMBRE'}</div>
                                <p style="margin:0; font-size:11px;"><b>ID:</b> ${data.id} | <b>TÉCNICO:</b> ${data.tecnico || 'S/D'}</p>
                            </div>
                            <div style="text-align:right; width: 30%;">
                                <p style="margin:0; font-weight:900; color: #34C759; font-size:11px;">GPS: ${data.gps_real ? `${data.gps_real.lat}, ${data.gps_real.lng}` : '---'}</p>
                                <p style="margin:4px 0 0 0; font-size:10px; font-weight:bold;">${formatTimestamp(data.timestamp)}</p>
                            </div>
                        </div>
                    </div>
                </td></tr>
            </thead>
            <tbody><tr><td>
                
                <div class="section-title">1. DATOS GENERALES DEL EMPLAZAMIENTO</div>
                <table class="data-table">
                    <tr><td class="label">CÓDIGO ID</td><td class="val">${data.codigo_id}</td><td class="label">TIPO INSTALACIÓN</td><td class="val">${data.tipo_inst}</td></tr>
                    <tr><td class="label">DISTRITO MUNICIPAL</td><td class="val">${data.distrito}</td><td class="label">DISTRITOS INFLUENCIA</td><td class="val">${data.dist_influencia}</td></tr>
                    <tr><td class="label">DIRECCIÓN POSTAL</td><td colspan="3" class="val">${data.direccion}</td></tr>
                    <tr><td class="label">ACCESO</td><td colspan="3" class="val">${data.acceso}</td></tr>
                    <tr><td class="label">REF. CATASTRAL</td><td class="val">${data.ref_catastral}</td><td class="label">AÑO CONSTRUCCIÓN</td><td class="val">${data.año_construccion}</td></tr>
                    <tr><td class="label">SUP. SUELO (m²)</td><td class="val">${data.superficie_suelo} m²</td><td class="label">SUP. CONSTRUIDA (m²)</td><td class="val">${data.superficie_construida} m²</td></tr>
                    <tr><td class="label">TITULARIDAD</td><td class="val">${data.titularidad}</td><td class="label">GESTIÓN</td><td class="val">${data.gestion}</td></tr>
                    <tr><td class="label">CONCEJAL RESPONSABLE</td><td colspan="3" class="val">${data.concejal_resp}</td></tr>
                    <tr><td class="label">AFORO TEÓRICO</td><td class="val">${data.aforo_teorico} pers.</td><td class="label">SUP. OPERATIVA</td><td class="val">${data.superficie_operativa} m²</td></tr>
                    <tr><td class="label">AFORO 3m² (OP)</td><td class="val">${data.aforo_operativo_3m2} pers.</td><td class="label">AFORO 5m² (PROL)</td><td class="val">${data.aforo_prolongado_5m2} pers.</td></tr>
                    <tr><td class="label">TIENE PAU</td><td class="val">${data.tiene_pau ? 'SÍ':'NO'}</td><td class="label">Nº EXPEDIENTE / FECHA</td><td class="val">${data.n_expediente_pau} (${data.fecha_pau})</td></tr>
                    <tr><td class="label">ASCENSORES</td><td class="val">${data.ascensores}</td><td class="label">LLAVES (UBICACIÓN)</td><td class="val">${data.llaves_ubicacion}</td></tr>
                </table>

                <div class="section-title">2. CONTACTOS Y RESPONSABLES</div>
                <table class="data-table">
                    <tr><td class="label">DIRECTOR ÁREA</td><td class="val">${data.dir_area_n}</td><td class="label">TELÉFONO</td><td class="val">${data.dir_area_t}</td></tr>
                    <tr><td class="label">RESPONSABLE 1</td><td class="val">${data.resp_centro_1_n}</td><td class="label">TELÉFONO</td><td class="val">${data.resp_centro_1_t}</td></tr>
                    <tr><td class="label">RESPONSABLE 2</td><td class="val">${data.resp_centro_2_n}</td><td class="label">TELÉFONO</td><td class="val">${data.resp_centro_2_t}</td></tr>
                    <tr><td class="label">JEFE EMERGENCIA</td><td class="val">${data.jefe_emerg_n}</td><td class="label">TELÉFONO</td><td class="val">${data.jefe_emerg_t}</td></tr>
                    <tr><td class="label">JEFE DISTRITO</td><td class="val">${data.jefe_dist_n}</td><td class="label">TELÉFONO</td><td class="val">${data.jefe_dist_t}</td></tr>
                </table>

                <div class="section-title">3. CAPACIDADES Y MATRICES TÉCNICAS</div>
                <table class="data-table">
                    <tr><th colspan="2">PISTAS CUBIERTAS</th><th colspan="2">SALAS POLIVALENTES</th></tr>
                    <tr><td class="label">PISTA 1</td><td class="val">${data.pista_1_m2} m² (H: ${data.pista_1_alt}m)</td><td class="label">SALA POLIV. 1</td><td class="val">${data.sala_1_m2} m²</td></tr>
                    <tr><td class="label">PISTA 2</td><td class="val">${data.pista_2_m2} m² (H: ${data.pista_2_alt}m)</td><td class="label">SALA POLIV. 2</td><td class="val">${data.sala_2_m2} m²</td></tr>
                    <tr><td class="label" style="background:#FFF3E0;">TOTAL CAPACIDAD</td><td class="val" style="color:#FF9500; background:#FFF3E0;">${data.superficie_total_m2_cap} m²</td><td class="label">SALA POLIV. 3</td><td class="val">${data.sala_3_m2} m²</td></tr>
                </table>

                <div class="matrix-wrapper">
                    ${renderMatrix(data.aseos_m, 'Am', 'ASEOS MASCULINOS')}
                    ${renderMatrix(data.aseos_f, 'Af', 'ASEOS FEMENINOS')}
                    ${renderMatrix(data.aseos_ad, 'Au_a', 'ASEOS ADAPTADOS (PMR)')}
                    ${renderMatrix(data.vest_m, 'Vm', 'VESTUARIOS MASCULINOS', true)}
                    ${renderMatrix(data.vest_f, 'Vf', 'VESTUARIOS FEMENINOS', true)}
                </div>

                <div class="section-title">4. LOGÍSTICA Y ACCESOS</div>
                <table class="data-table">
                    <tr><td class="label">Nº ACCESOS PEATONAL</td><td class="val">${data.n_peatonales}</td><td class="label">Nº ACCESOS VEHÍCULO</td><td class="val">${data.n_vehiculos}</td></tr>
                    <tr><td class="label">ACCESO PMR</td><td class="val">${data.acc_pmr_si?'SÍ':'NO'}</td><td class="label">PARKING</td><td class="val">${data.parking_plazas}</td></tr>
                    <tr><td class="label">ZONA CARGA/DESCARGA</td><td class="val">${data.carga_si?'SÍ':'NO'}</td><td class="label">SUP. CARGA (m²)</td><td class="val">${data.carga_m2} m²</td></tr>
                    <tr><td class="label">ZONA LIBRE EXTERIOR</td><td class="val">${data.libre_ext_si?'SÍ':'NO'}</td><td class="label">SUP. LIBRE (m²)</td><td class="val">${data.libre_ext_m2} m²</td></tr>
                    <tr><td class="label">ACCESO RODADO (SÍ/NO)</td><td class="val">${data.acc_rodado?'SÍ':'NO'}</td><td class="label">METRO (PARADA)</td><td class="val">${data.metro}</td></tr>
                    <tr><td class="label">AUTOBÚS (LÍNEAS)</td><td colspan="3" class="val">${data.bus}</td></tr>
                </table>

                <div class="section-title">5. SERVICIOS, OPERATIVIDAD Y SANIDAD</div>
                <table class="data-table">
                    <tr><td class="label">AGUA POTABLE</td><td class="val">${data.agua?'SÍ':'NO'}</td><td class="label">ELECTRICIDAD</td><td class="val">${data.luz?'SÍ':'NO'}</td></tr>
                    <tr><td class="label">SISTEMA ACS</td><td class="val">${data.acs_si?'SÍ':'NO'} (${data.acs_sistema})</td><td class="label">CLIMATIZACIÓN</td><td class="val">${data.clima?'SÍ':'NO'}</td></tr>
                    <tr><td class="label">GRUPO ELECTRÓGENO</td><td class="val">${data.grupo_kva} kVA</td><td class="label">SISTEMA SAI</td><td class="val">${data.sai_kva} kVA</td></tr>
                    <tr><td class="label">WIFI / INTERNET</td><td class="val">${data.wifi?'SÍ':'NO'}</td><td class="label">RED P. CIVIL</td><td class="val">${data.telecom_red}</td></tr>
                    <tr><td class="label">BOTIQUINES (UD)</td><td class="val">${data.botiquines}</td><td class="label">DEAS (UD)</td><td class="val">${data.deas}</td></tr>
                    <tr><td class="label">SILLAS RUEDAS (UD)</td><td class="val">${data.sillas_ruedas}</td><td class="label">CAMILLAS (UD)</td><td class="val">${data.camillas}</td></tr>
                    <tr><td class="label">COCINA (m²)</td><td class="val">${data.cocina_si ? data.cocina_m2 : 'NO'}</td><td class="label">COMEDOR (m²)</td><td class="val">${data.comedor_si ? data.comedor_m2 : 'NO'}</td></tr>
                    <tr><td class="label">ESPACIO MASCOTAS</td><td class="val">${data.mascotas_si ? data.mascotas_m2 : 'NO'}</td><td class="label">ZONA VULNERABLES</td><td class="val">${data.vulnerables_si ? data.vulnerables_m2 : 'NO'}</td></tr>
                    <tr><td class="label">PRESENCIA MÉDICA</td><td colspan="3" class="val">${data.presencia_medica}</td></tr>
                </table>

                <div class="section-title">6. SEGURIDAD CONTRA INCENDIOS</div>
                <table class="data-table">
                    <tr><td class="label">EXTINTORES</td><td class="val">${data.extintores?'SÍ':'NO'}</td><td class="label">BIES</td><td class="val">${data.bies?'SÍ':'NO'}</td></tr>
                    <tr><td class="label">ALARMA</td><td class="val">${data.alarma?'SÍ':'NO'}</td><td class="label">DETECCIÓN</td><td class="val">${data.deteccion?'SÍ':'NO'}</td></tr>
                    <tr><td class="label">ROCIADORES</td><td class="val">${data.rociadores?'SÍ':'NO'}</td><td class="label">COLUMNA SECA</td><td class="val">${data.col_seca?'SÍ':'NO'}</td></tr>
                    <tr><td class="label">EXTINCIÓN AUTOMÁTICA</td><td class="val">${data.ext_auto?'SÍ':'NO'}</td><td class="label">HIDRANTES (DIST.)</td><td class="val">${data.hidrantes_dist}</td></tr>
                    <tr><td class="label">ALUMBRADO EMERGENCIA</td><td class="val">${data.alumbrado_em?'SÍ':'NO'}</td><td class="label">SEÑALIZACIÓN</td><td class="val">${data.señalizacion?'SÍ':'NO'}</td></tr>
                </table>

                <div class="section-title">7. CONTROL Y ACTUALIZACIÓN</div>
                <table class="data-table">
                    <tr><td class="label">VERSIÓN FICHA</td><td class="val">${data.v_ficha}</td><td class="label">FECHA ELABORACIÓN</td><td class="val">${data.f_elab}</td></tr>
                    <tr><td class="label">FECHA REVISIÓN</td><td class="val">${data.f_rev}</td><td class="label">TÉCNICO RESPONSABLE</td><td class="val">${data.tecnico}</td></tr>
                    <tr><td class="label">HISTÓRICO REVISIONES</td><td colspan="3" class="val">${data.historico}</td></tr>
                    <tr><td class="label">OBSERVACIONES FINALES</td><td colspan="3" class="val">${data.obs}</td></tr>
                    <tr><td class="label">RIESGOS EMPLAZAMIENTO</td><td colspan="3" class="val">${data.riesgos}</td></tr>
                </table>

                <div style="page-break-before: always;"></div>
                <div class="section-title">8. ANEXO DE EVIDENCIAS FOTOGRÁFICAS (4:3)</div>
                ${photosHtml || '<p style="text-align:center; padding:50px; color:#999;">No se han capturado evidencias gráficas.</p>'}
            </td></tr></tbody>
        </table>
    </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
        Alert.alert("Error Crítico Motor PDF", e.message);
    }
};