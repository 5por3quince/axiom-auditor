// AXIOM DATA - ZONAS SEGURAS - VERSIÓN 15.2 MASTER FINAL (v2026.04.25)
// AUTOR: JESUS MUÑOZ TRIGUERO - PROTECCION CIVIL MALAGA - 2026
// REVISIÓN: ARQUITECTO SENIOR - RESTAURACIÓN CAMPOS TÉCNICOS PISTAS

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  Activity, Camera, Check, Cloud, FileText, Info, List, Lock,
  Map as MapIcon, MapPin,
  Minus,
  Plus, Settings,
  Trash2,
  Users,
  X, Zap
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Modal, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// FIREBASE CORE
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// MOTOR DE INFORMES
import { generateAuditPDF } from './ReportGenerator';

const THEME = {
  bg: '#F2F2F7', card: '#FFFFFF', accent: '#FF9500', 
  success: '#34C759', info: '#007AFF', text: '#000000',
  textSecondary: '#636366', border: '#E5E5EA', danger: '#FF3B30'
};

// =============================================================================
// COMPONENTES ATÓMICOS EXTERNOS (DEFINIDOS ARRIBA PARA EVITAR ERRORES DE SCOPE)
// =============================================================================

const Input = ({ label, value, onChange, width, keyboard }) => (
  <View style={[styles.inputBox, { width: width }]}><Text style={styles.inputLabel}>{label}</Text><TextInput style={styles.input} value={String(value || '')} onChangeText={onChange} keyboardType={keyboard} includeFontPadding={false} textAlignVertical="center" /></View>
);

const Toggle = ({ label, value, onValueChange, width }) => (
  <View style={[styles.toggleBox, { width: width }]}><View style={{flex:1}}><Text style={styles.inputLabel}>{label}</Text><Text style={styles.toggleStatus}>{value?'SÍ':'NO'}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ true: THEME.success }} /></View>
);

const AseoGrid = ({ title, data, onUpdate }) => {
    const sum = (key) => (data || []).reduce((acc, curr) => acc + (parseInt(curr[key]) || 0), 0);
    return (
        <View style={styles.aseoBlock}><Text style={styles.aseoTitle}>{title}</Text>
            {(data || []).map((item, i) => (
                <View key={i} style={styles.gridRow}>
                    <Text style={styles.zoneLabel}>{i + 1}</Text>
                    <Input label="numero" value={item.n} onChange={(v)=>onUpdate(i,'n',v)} width="13%" keyboard="numeric" />
                    <Input label="Inodoros" value={item.i} onChange={(v)=>onUpdate(i,'i',v)} width="13%" keyboard="numeric" />
                    <Input label="Urinarios" value={item.u} onChange={(v)=>onUpdate(i,'u',v)} width="13%" keyboard="numeric" />
                    <Input label="Lavabos" value={item.l} onChange={(v)=>onUpdate(i,'l',v)} width="13%" keyboard="numeric" />
                    <Input label="Duchas" value={item.d} onChange={(v)=>onUpdate(i,'d',v)} width="13%" keyboard="numeric" />
                    <Input label="pmr" value={item.pmr} onChange={(v)=>onUpdate(i,'pmr',v)} width="13%" keyboard="numeric" />
                </View>
            ))}
            <View style={[styles.gridRow, {borderTopWidth: 1, borderColor: '#ccc', paddingTop: 5}]}><Text style={styles.zoneLabel}>Σ</Text><Text style={styles.totalVal}>{sum('n')}</Text><Text style={styles.totalVal}>{sum('i')}</Text><Text style={styles.totalVal}>{sum('u')}</Text><Text style={styles.totalVal}>{sum('l')}</Text><Text style={styles.totalVal}>{sum('d')}</Text><Text style={styles.totalVal}>{sum('pmr')}</Text></View>
        </View>
    );
};

const VestuarioGrid = ({ title, data, onUpdate }) => {
    const sum = (key) => (data || []).reduce((acc, curr) => acc + (parseInt(curr[key]) || 0), 0);
    return (
        <View style={styles.aseoBlock}><Text style={styles.aseoTitle}>{title}</Text>
            {(data || []).map((item, i) => (
                <View key={i} style={styles.gridRow}>
                    <Text style={styles.zoneLabel}>V{i + 1}</Text>
                    <Input label="Taquillas" value={item.taq} onChange={(v)=>onUpdate(i,'taq',v)} width="11%" keyboard="numeric" />
                    <Input label="Inodoros" value={item.i} onChange={(v)=>onUpdate(i,'i',v)} width="11%" keyboard="numeric" />
                    <Input label="Urinarios" value={item.u} onChange={(v)=>onUpdate(i,'u',v)} width="11%" keyboard="numeric" />
                    <Input label="Lavabos" value={item.l} onChange={(v)=>onUpdate(i,'l',v)} width="11%" keyboard="numeric" />
                    <Input label="Duchas" value={item.d} onChange={(v)=>onUpdate(i,'d',v)} width="11%" keyboard="numeric" />
                    <Input label="Pmr" value={item.pmr} onChange={(v)=>onUpdate(i,'pmr',v)} width="11%" keyboard="numeric" />
                    <Input label="Acc" value={item.acc} onChange={(v)=>onUpdate(i,'acc',v)} width="11%" keyboard="numeric" />
                </View>
            ))}
            <View style={[styles.gridRow, {borderTopWidth: 1, borderColor: '#ccc', paddingTop: 5}]}><Text style={styles.zoneLabel}>Σ</Text><Text style={styles.totalVal}>{sum('taq')}</Text><Text style={styles.totalVal}>{sum('i')}</Text><Text style={styles.totalVal}>{sum('u')}</Text><Text style={styles.totalVal}>{sum('l')}</Text><Text style={styles.totalVal}>{sum('d')}</Text><Text style={styles.totalVal}>{sum('pmr')}</Text><Text style={styles.totalVal}>{sum('acc')}</Text></View>
        </View>
    );
};

const NavTab = ({ id, label, icon: Icon, active, set }) => (
  <TouchableOpacity style={[styles.navTab, active === id && styles.navTabActive]} onPress={()=>set(id)}><Icon color={active === id ? THEME.accent : THEME.textSecondary} size={18} /><Text style={styles.navTabText}>{label}</Text></TouchableOpacity>
);

const Action = ({ icon: Icon, label, color, onPress }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}><Icon color="#fff" size={22} /><Text style={styles.actionBtnText}>{label}</Text></TouchableOpacity>
);

// =============================================================================
// FUNCIÓN PRINCIPAL APP
// =============================================================================

export default function App() {
  const [view, setView] = useState('HUB'); 
  const [activeTab, setActiveTab] = useState('DATOS GENERALES');
  const [loading, setLoading] = useState(false);
  const [inspecciones, setInspecciones] = useState([]); 
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [tempCaption, setTempCaption] = useState('');
  
  const getInitialForm = () => ({
    // 1. DATOS GENERALES
    id: '', codigo_id: '', tipo_inst: '', nombre: '', distrito: '', dist_influencia: '',
    direccion: '', acceso: '', coordenadas_gms: '', ref_catastral: '', año_construccion: '',
    superficie_suelo: '', superficie_construida: '', titularidad: '', gestion: '',
    concejal_resp: '', url: '', aforo_teorico: '', superficie_operativa: '',
    aforo_operativo_3m2: '', aforo_prolongado_5m2: '', tiene_pau: false, 
    n_expediente_pau: '', fecha_pau: '', ascensores: '', llaves_ubicacion: '', gps_real: null,
    // 2. CONTACTOS
    dir_area_n: '', dir_area_t: '', resp_centro_1_n: '', resp_centro_1_t: '', resp_centro_2_n: '', resp_centro_2_t: '',
    centro_tel_gen: '', email: '', jefe_emerg_n: '', jefe_emerg_t: '', jefe_dist_n: '', jefe_dist_t: '',
    // 3. CAPACIDADES (RESTAURADO CON ALTURAS v15.2)
    pista_1_m2: '', pista_1_alt: '', pista_2_m2: '', pista_2_alt: '',
    sala_1_m2: '', sala_2_m2: '', sala_3_m2: '', superficie_total_m2_cap: '', 
    otras_salas_dinamicas: [], 
    aseos_m: Array(4).fill({ n: '', i: '', u: '', l: '', d: '', pmr: '' }), 
    aseos_f: Array(4).fill({ n: '', i: '', u: '', l: '', d: '', pmr: '' }),
    aseos_ad: Array(6).fill({ n: '', i: '', u: '', l: '', d: '', pmr: '' }),
    vest_m: Array(6).fill({ n: '', taq: '', i: '', u: '', l: '', d: '', pmr: '', acc: '' }),
    vest_f: Array(6).fill({ n: '', taq: '', i: '', u: '', l: '', d: '', pmr: '', acc: '' }),
    // 4. LOGÍSTICA
    n_peatonales: '', n_vehiculos: '', acc_pmr_si: false, parking_plazas: '', parking_m2: '',
    carga_si: false, carga_m2: '', libre_ext_si: false, libre_ext_m2: '', acc_rodado: false, metro: '', bus: '',
    // 5. SERVICIOS
    agua: false, luz: false, acs_si: false, acs_sistema: '', clima: false,
    grupo_kva: '', sai_kva: '', wifi: false, telecom_red: '', seg_perimetral: '',
    botiquines: '', deas: '', sillas_ruedas: '', camillas: '', presencia_medica: '',
    cocina_si: false, cocina_m2: '', comedor_si: false, comedor_m2: '',
    mascotas_si: false, mascotas_m2: '', vulnerables_si: false, vulnerables_m2: '',
    obs: '', riesgos: '',
    extintores: false, bies: false, alarma: false, deteccion: false, rociadores: false,
    col_seca: false, ext_auto: false, hidrantes_dist: '', alumbrado_em: false, señalizacion: false,
    v_ficha: 'v1', f_elab: new Date().toLocaleDateString(), f_rev: '', tecnico: '', historico: '', fotos: []
  });

  const [form, setForm] = useState(getInitialForm());

  useEffect(() => {
    const q = query(collection(db, "organizations/ayto_malaga/safe_areas"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      setInspecciones(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });
  }, []);

  // --- HANDLERS TÁCTICOS ---
  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const updateNestedArray = (category, index, key, value) => {
    setForm(prev => {
        const newArr = [...prev[category]];
        newArr[index] = { ...newArr[index], [key]: value };
        return { ...prev, [category]: newArr };
    });
  };

  const removeLastRow = (category) => {
    setForm(prev => {
      if (prev[category].length === 0) return prev;
      const newArr = [...prev[category]];
      newArr.pop();
      return { ...prev, [category]: newArr };
    });
  };

  const captureLocation = async () => {
    if (form.gps_real) return Alert.alert("ORIGEN FIJO");
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    setLoading(true);
    let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const lat = loc.coords.latitude.toFixed(6);
    const lng = loc.coords.longitude.toFixed(6);
    setForm(prev => ({ ...prev, gps_real: { lat, lng }, coordenadas_gms: `${lat}; ${lng}` }));
    setLoading(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    let result = await ImagePicker.launchCameraAsync({ quality: 0.3, allowsEditing: false });
    if (!result.canceled) {
      setTempPhotoUri(result.assets[0].uri);
      setTimeout(() => setModalFotoVisible(true), 500);
    }
  };

  const savePhotoWithCaption = () => {
    updateField('fotos', [...form.fotos, { uri: tempPhotoUri, caption: tempCaption || "Evidencia" }]);
    setModalFotoVisible(false);
    setTempPhotoUri(null);
    setTempCaption('');
  };

  const syncToCloud = async () => {
    if(!form.id) return Alert.alert("Error", "ID obligatorio.");
    setLoading(true);
    try {
      await setDoc(doc(db, "organizations/ayto_malaga/safe_areas", form.id), { 
          ...form, 
          timestamp: serverTimestamp(),
          f_rev: new Date().toLocaleDateString()
      });
      setForm(getInitialForm());
      setView('HUB');
    } catch (e) { Alert.alert("Error Cloud", e.message); }
    finally { setLoading(false); }
  };

  const deleteAudit = (id) => {
    Alert.alert("ELIMINAR", "¿Borrar registro?", [
      { text: "No" }, { text: "Sí", style: "destructive", onPress: async () => {
          try { await deleteDoc(doc(db, "organizations/ayto_malaga/safe_areas", id)); } catch(e){}
      }}
    ]);
  };

  // --- RENDERIZADO DE PESTAÑAS ---

  const renderGeneral = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>1. DATOS GENERALES</Text>
        <Input label="ID" value={form.id} onChange={(v)=>updateField('id',v)} width="24%" />
        <Input label="Código identificación" value={form.codigo_id} onChange={(v)=>updateField('codigo_id',v)} width="24%" />
        <Input label="Tipo de instalación" value={form.tipo_inst} onChange={(v)=>updateField('tipo_inst',v)} width="49%" />
        <Input label="Nombre del centro" value={form.nombre} onChange={(v)=>updateField('nombre',v)} width="100%" />
        <Input label="Distrito" value={form.distrito} onChange={(v)=>updateField('distrito',v)} width="32%" />
        <Input label="Distritos de influencia" value={form.dist_influencia} onChange={(v)=>updateField('dist_influencia',v)} width="66%" />
        <Input label="Dirección" value={form.direccion} onChange={(v)=>updateField('direccion',v)} width="100%" />
        <Input label="Acceso" value={form.acceso} onChange={(v)=>updateField('acceso',v)} width="49%" />
        <Input label="COORDENADAS (GMS/UTM)" value={form.coordenadas_gms} onChange={(v)=>updateField('coordenadas_gms',v)} width="49%" />
        <Input label="Referencia Catastral" value={form.ref_catastral} onChange={(v)=>updateField('ref_catastral',v)} width="49%" />
        <Input label="Año construcción" value={form.año_construccion} onChange={(v)=>updateField('año_construccion',v)} width="24%" />
        <Input label="Superficie suelo (m²)" value={form.superficie_suelo} onChange={(v)=>updateField('superficie_suelo',v)} width="24%" />
        <Input label="Superficie construida (m²)" value={form.superficie_construida} onChange={(v)=>updateField('superficie_construida',v)} width="49%" />
        <Input label="Titularidad" value={form.titularidad} onChange={(v)=>updateField('titularidad',v)} width="32%" />
        <Input label="Gestión" value={form.gestion} onChange={(v)=>updateField('gestion',v)} width="32%" />
        <Input label="Concejal responsable" value={form.concejal_resp} onChange={(v)=>updateField('concejal_resp',v)} width="32%" />
        <Input label="URL" value={form.url} onChange={(v)=>updateField('url',v)} width="100%" />
        <Input label="Aforo teórico (p)" value={form.aforo_teorico} onChange={(v)=>updateField('aforo_teorico',v)} width="32%" />
        <Input label="Superficie operativa (m²)" value={form.superficie_operativa} onChange={(v)=>updateField('superficie_operativa',v)} width="32%" />
        <Input label="Aforo operativo (3m²/p)" value={form.aforo_operativo_3m2} onChange={(v)=>updateField('aforo_operativo_3m2',v)} width="32%" />
        <Input label="Aforo prolongado (5m²/p)" value={form.aforo_prolongado_5m2} onChange={(v)=>updateField('aforo_prolongado_5m2',v)} width="32%" />
        <Toggle label="Tiene PAU (Sí/No)" value={form.tiene_pau} onValueChange={(v)=>updateField('tiene_pau',v)} width="32%" />
        <Input label="Nº expediente PAU" value={form.n_expediente_pau} onChange={(v)=>updateField('n_expediente_pau',v)} width="32%" />
        <Input label="Fecha PAU" value={form.fecha_pau} onChange={(v)=>updateField('fecha_pau',v)} width="32%" />
        <Input label="Ascensores" value={form.ascensores} onChange={(v)=>updateField('ascensores',v)} width="49%" />
        <Input label="Llaves del centro (ubicación)" value={form.llaves_ubicacion} onChange={(v)=>updateField('llaves_ubicacion',v)} width="49%" />
      </View>
    </ScrollView>
  );

  const renderContactos = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>2. CONTACTOS</Text>
        <Input label="Director del área (nombre)" value={form.dir_area_n} onChange={(v)=>updateField('dir_area_n',v)} width="66%" />
        <Input label="Director del área (teléfono)" value={form.dir_area_t} onChange={(v)=>updateField('dir_area_t',v)} width="32%" keyboard="phone-pad" />
        <Input label="Responsable del centro 1 (nombre)" value={form.resp_centro_1_n} onChange={(v)=>updateField('resp_centro_1_n',v)} width="66%" />
        <Input label="Responsable del centro 1 (teléfono)" value={form.resp_centro_1_t} onChange={(v)=>updateField('resp_centro_1_t',v)} width="32%" keyboard="phone-pad" />
        <Input label="Responsable del centro 2 (nombre)" value={form.resp_centro_2_n} onChange={(v)=>updateField('resp_centro_2_n',v)} width="66%" />
        <Input label="Responsable del centro 2 (teléfono)" value={form.resp_centro_2_t} onChange={(v)=>updateField('resp_centro_2_t',v)} width="32%" keyboard="phone-pad" />
        <Input label="Centro (teléfono general)" value={form.centro_tel_gen} onChange={(v)=>updateField('centro_tel_gen',v)} width="49%" />
        <Input label="Email" value={form.email} onChange={(v)=>updateField('email',v)} width="49%" keyboard="email-address" />
        <Input label="Jefe de Emergencia_PAU (nombre)" value={form.jefe_emerg_n} onChange={(v)=>updateField('jefe_emerg_n',v)} width="66%" />
        <Input label="Jefe de Emergencia_PAU (teléfono)" value={form.jefe_emerg_t} onChange={(v)=>updateField('jefe_emerg_t',v)} width="32%" />
        <Input label="Jefe de Distrito (nombre)" value={form.jefe_dist_n} onChange={(v)=>updateField('jefe_dist_n',v)} width="66%" />
        <Input label="Jefe de Distrito (teléfono)" value={form.jefe_dist_t} onChange={(v)=>updateField('jefe_dist_t',v)} width="32%" />
      </View>
    </ScrollView>
  );

  const renderCapacidades = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>3. CAPACIDADES</Text>
        
        {/* BLOQUE PISTAS TÉCNICAS */}
        <Input label="Pista 1 (m²)" value={form.pista_1_m2} onChange={(v)=>updateField('pista_1_m2',v)} width="49%" />
        <Input label="Pista 1 Altura (m)" value={form.pista_1_alt} onChange={(v)=>updateField('pista_1_alt',v)} width="49%" />
        <Input label="Pista 2 (m²)" value={form.pista_2_m2} onChange={(v)=>updateField('pista_2_m2',v)} width="49%" />
        <Input label="Pista 2 Altura (m)" value={form.pista_2_alt} onChange={(v)=>updateField('pista_2_alt',v)} width="49%" />
        
        {/* BLOQUE SALAS POLIVALENTES */}
        <Input label="Sala Polivalente 1 (m²)" value={form.sala_1_m2} onChange={(v)=>updateField('sala_1_m2',v)} width="49%" />
        <Input label="Sala Polivalente 2 (m²)" value={form.sala_2_m2} onChange={(v)=>updateField('sala_2_m2',v)} width="49%" />
        <Input label="Sala Polivalente 3 (m²)" value={form.sala_3_m2} onChange={(v)=>updateField('sala_3_m2',v)} width="49%" />
        <Input label="Superficie Total (m²)" value={form.superficie_total_m2_cap} onChange={(v)=>updateField('superficie_total_m2_cap',v)} width="49%" />
        
        {/* BOTONERA DINÁMICA DE SALAS EXTRA */}
        <View style={styles.salaControls}>
            <Text style={styles.salaControlsTitle}>GESTIÓN SALAS ADICIONALES</Text>
            <View style={{flexDirection: 'row', gap: 15}}>
                <TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('otras_salas_dinamicas', [...form.otras_salas_dinamicas, {id:Date.now(), m2:''}])}>
                    <Plus color={THEME.info} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('otras_salas_dinamicas')}>
                    <Minus color={THEME.danger} size={20} />
                </TouchableOpacity>
            </View>
        </View>

        { (form.otras_salas_dinamicas || []).map((s, i) => (
            <Input key={s.id} label={`SALA ADICIONAL ${i+1}`} value={s.m2} onChange={(v)=>{ let n=[...form.otras_salas_dinamicas]; n[i].m2=v; updateField('otras_salas_dinamicas',n); }} width="49%" />
        ))}

        <Text style={[styles.sectionTitle, {marginTop: 30}]}>INFRAESTRUCTURA HIGIÉNICA</Text>
        <AseoGrid title="Aseos masculinos (Am)" data={form.aseos_m} onUpdate={(i,k,v)=>updateNestedArray('aseos_m',i,k,v)} />
        <View style={styles.btnRow}><TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('aseos_m', [...form.aseos_m, {n:'',i:'',u:'',l:'',d:'',pmr:''}])}><Plus color={THEME.info} size={16} /></TouchableOpacity><TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('aseos_m')}><X color={THEME.danger} size={16} /></TouchableOpacity></View>
        
        <AseoGrid title="Aseos femeninos (Af)" data={form.aseos_f} onUpdate={(i,k,v)=>updateNestedArray('aseos_f',i,k,v)} />
        <View style={styles.btnRow}><TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('aseos_f', [...form.aseos_f, {n:'',i:'',u:'',l:'',d:'',pmr:''}])}><Plus color={THEME.info} size={16} /></TouchableOpacity><TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('aseos_f')}><X color={THEME.danger} size={16} /></TouchableOpacity></View>
        
        <AseoGrid title="Aseos adaptados (Au_a)" data={form.aseos_ad} onUpdate={(i,k,v)=>updateNestedArray('aseos_ad',i,k,v)} />
        <View style={styles.btnRow}><TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('aseos_ad', [...form.aseos_ad, {n:'',i:'',u:'',l:'',d:'',pmr:''}])}><Plus color={THEME.info} size={16} /></TouchableOpacity><TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('aseos_ad')}><X color={THEME.danger} size={16} /></TouchableOpacity></View>

        <VestuarioGrid title="Vestuarios masculinos (Vm)" data={form.vest_m} onUpdate={(i,k,v)=>updateNestedArray('vest_m',i,k,v)} />
        <View style={styles.btnRow}><TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('vest_m', [...form.vest_m, {n:'',taq:'',i:'',u:'',l:'',d:'',pmr:'',acc:''}])}><Plus color={THEME.info} size={16} /></TouchableOpacity><TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('vest_m')}><X color={THEME.danger} size={16} /></TouchableOpacity></View>

        <VestuarioGrid title="Vestuarios femeninos (Vf)" data={form.vest_f} onUpdate={(i,k,v)=>updateNestedArray('vest_f',i,k,v)} />
        <View style={styles.btnRow}><TouchableOpacity style={styles.smallAdd} onPress={()=>updateField('vest_f', [...form.vest_f, {n:'',taq:'',i:'',u:'',l:'',d:'',pmr:'',acc:''}])}><Plus color={THEME.info} size={16} /></TouchableOpacity><TouchableOpacity style={styles.smallRem} onPress={()=>removeLastRow('vest_f')}><X color={THEME.danger} size={16} /></TouchableOpacity></View>
      </View>
    </ScrollView>
  );

  const renderLogistica = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>4. LOGÍSTICA Y ACCESOS</Text>
        <Text style={styles.subTitle}>Interior recinto</Text>
        <Input label="Nº accesos/salidas" value={form.n_peatonales} onChange={(v)=>updateField('n_peatonales',v)} width="32%" />
        <Input label="Nº accesos vehículo" value={form.n_vehiculos} onChange={(v)=>updateField('n_vehiculos',v)} width="32%" />
        <Toggle label="Acceso PMR (Sí/No)" value={form.acc_pmr_si} onValueChange={(v)=>updateField('acc_pmr_si',v)} width="32%" />
        <Input label="Parking (Sí_nº plazas_m²/No)" value={form.parking_plazas} onChange={(v)=>updateField('parking_plazas',v)} width="100%" />
        <Toggle label="Zona de carga y descarga" value={form.carga_si} onValueChange={(v)=>updateField('carga_si',v)} width="32%" />
        <Input label="m2 Carga" value={form.carga_m2} onChange={(v)=>updateField('carga_m2',v)} width="66%" />
        <Toggle label="Zona libre exterior" value={form.libre_ext_si} onValueChange={(v)=>updateField('libre_ext_si',v)} width="32%" />
        <Input label="m2 Libre" value={form.libre_ext_m2} onChange={(v)=>updateField('libre_ext_m2',v)} width="66%" />
        <Text style={styles.subTitle}>Exterior recinto</Text>
        <Toggle label="Acceso rodado (Sí/No)" value={form.acc_rodado} onValueChange={(v)=>updateField('acc_rodado',v)} width="32%" />
        <Input label="Metro (Parada)" value={form.metro} onChange={(v)=>updateField('metro',v)} width="32%" />
        <Input label="Autobús (Líneas)" value={form.bus} onChange={(v)=>updateField('bus',v)} width="32%" />
      </View>
    </ScrollView>
  );

  const renderServicios = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>5. SERVICIOS Y OPERATIVIDAD</Text>
        <Toggle label="Agua potable (Sí/No)" value={form.agua} onValueChange={(v)=>updateField('agua',v)} width="32%" />
        <Toggle label="Electricidad (Sí/No)" value={form.luz} onValueChange={(v)=>updateField('luz',v)} width="32%" />
        <Toggle label="ACS (Sí_sistema/No)" value={form.acs_si} onValueChange={(v)=>updateField('acs_si',v)} width="32%" />
        <Input label="Sistema ACS" value={form.acs_sistema} onChange={(v)=>updateField('acs_sistema',v)} width="49%" />
        <Toggle label="Climatización (Sí/No)" value={form.clima} onValueChange={(v)=>updateField('clima',v)} width="49%" />
        <Input label="Grupo electrógeno (Sí_kVA/No)" value={form.grupo_kva} onChange={(v)=>updateField('grupo_kva',v)} width="49%" />
        <Input label="SAI (Sí_kVA/No)" value={form.sai_kva} onChange={(v)=>updateField('sai_kva',v)} width="49%" />
        <Toggle label="Internet/WiFi (Sí/No)" value={form.wifi} onValueChange={(v)=>updateField('wifi',v)} width="32%" />
        <Input label="Cobertura comunicaciones (Red P. Civil)" value={form.telecom_red} onChange={(v)=>updateField('telecom_red',v)} width="66%" />
        <Input label="Seguridad perimetral (Sí_tipo/No)" value={form.seg_perimetral} onChange={(v)=>updateField('seg_perimetral',v)} width="66%" />
        <Text style={styles.sectionTitle}>RECURSOS SANITARIOS</Text>
        <Input label="Botiquines (Sí_ud/No)" value={form.botiquines} onChange={(v)=>updateField('botiquines',v)} width="24%" />
        <Input label="DEAs (Sí_ud/No)" value={form.deas} onChange={(v)=>updateField('deas',v)} width="24%" />
        <Input label="Sillas de ruedas (Sí_ud/No)" value={form.sillas_ruedas} onChange={(v)=>updateField('sillas_ruedas',v)} width="24%" />
        <Input label="Camillas (Sí_ud/No)" value={form.camillas} onChange={(v)=>updateField('camillas',v)} width="24%" />
        <Input label="Otros" value={form.presencia_medica} onChange={(v)=>updateField('presencia_medica',v)} width="100%" />
        <Text style={styles.sectionTitle}>SEGURIDAD CONTRA INCENDIOS</Text>
        <Toggle label="Extintores" value={form.extintores} onValueChange={(v)=>updateField('extintores',v)} width="32%" />
        <Toggle label="BIEs" value={form.bies} onValueChange={(v)=>updateField('bies',v)} width="32%" />
        <Toggle label="Alarma" value={form.alarma} onValueChange={(v)=>updateField('alarma',v)} width="32%" />
        <Toggle label="Detección" value={form.deteccion} onValueChange={(v)=>updateField('deteccion',v)} width="32%" />
        <Toggle label="Rociadores" value={form.rociadores} onValueChange={(v)=>updateField('rociadores',v)} width="32%" />
        <Toggle label="Columna seca" value={form.col_seca} onValueChange={(v)=>updateField('col_seca',v)} width="32%" />
        <Toggle label="Extinción automática" value={form.ext_auto} onValueChange={(v)=>updateField('ext_auto',v)} width="32%" />
        <Input label="Hidrantes (distancia_m)" value={form.hidrantes_dist} onChange={(v)=>updateField('hidrantes_dist',v)} width="32%" />
        <Toggle label="Alumbrado emergencia" value={form.alumbrado_em} onValueChange={(v)=>updateField('alumbrado_em',v)} width="32%" />
        <Toggle label="Señalización" value={form.señalizacion} onValueChange={(v)=>updateField('señalizacion',v)} width="32%" />
        <Text style={styles.sectionTitle}>OTROS</Text>
        <Toggle label="Cocina (Sí_m2/No)" value={form.cocina_si} onValueChange={(v)=>updateField('cocina_si',v)} width="49%" />
        <Input label="m2 Cocina" value={form.cocina_m2} onChange={(v)=>updateField('cocina_m2',v)} width="49%" />
        <Toggle label="Comedor (Sí_m2/No)" value={form.comedor_si} onValueChange={(v)=>updateField('comedor_si',v)} width="49%" />
        <Input label="m2 Comedor" value={form.comedor_m2} onChange={(v)=>updateField('comedor_m2',v)} width="49%" />
        <Toggle label="Espacio Mascotas (Sí_m2/No)" value={form.mascotas_si} onValueChange={(v)=>updateField('mascotas_si',v)} width="49%" />
        <Input label="m2 Mascotas" value={form.mascotas_m2} onChange={(v)=>updateField('mascotas_m2',v)} width="49%" />
        <Toggle label="Zona Vulnerables (Sí_m2/No)" value={form.vulnerables_si} onValueChange={(v)=>updateField('vulnerables_si',v)} width="49%" />
        <Input label="m2 Vulnerables" value={form.vulnerables_m2} onChange={(v)=>updateField('vulnerables_m2',v)} width="49%" />
        <Input label="Observaciones" value={form.obs} onChange={(v)=>updateField('obs',v)} width="100%" />
        <Input label="Riesgos del emplazamiento" value={form.riesgos} onChange={(v)=>updateField('riesgos',v)} width="100%" />
      </View>
    </ScrollView>
  );

  const renderControl = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom: 220}}>
      <View style={styles.grid}>
        <Text style={styles.sectionTitle}>6. CONTROL Y ACTUALIZACIÓN</Text>
        <Input label="Versión ficha" value={form.v_ficha} onChange={(v)=>updateField('v_ficha',v)} width="32%" />
        <Input label="Fecha elaboración ficha" value={form.f_elab} onChange={(v)=>updateField('f_elab',v)} width="32%" />
        <Input label="Fecha última revisión" value={form.f_rev} onChange={(v)=>updateField('f_rev',v)} width="32%" />
        <Input label="Técnico responsable elaboración" value={form.tecnico} onChange={(v)=>updateField('tecnico',v)} width="100%" />
        <Input label="Histórico revisiones" value={form.historico} onChange={(v)=>updateField('historico',v)} width="100%" />
      </View>
    </ScrollView>
  );

  if (view === 'HUB') return (
    <SafeAreaProvider><SafeAreaView style={styles.container}>
      <View style={styles.hubHeader}>
        <View style={styles.brandGroup}><Image source={require('./assets/images/icon.png')} style={styles.hubLogo} /><Text style={styles.hubTitle}>AXIOM - ZONAS SEGURAS</Text></View>
        <TouchableOpacity style={styles.newBtn} onPress={() => { setForm(getInitialForm()); setView('FORM'); }}><Plus color="#fff" size={24} /><Text style={styles.newBtnText}>NUEVA INSPECCIÓN</Text></TouchableOpacity>
      </View>
      <ScrollView style={{padding: 20}}>{inspecciones.map((ins, i) => (
        <View key={i} style={styles.hubCard}>
          <TouchableOpacity style={{flex:1}} onPress={()=> { setForm({ ...getInitialForm(), ...ins }); setView('FORM'); }}><Text style={styles.hubCardId}>{ins.id}</Text><Text style={styles.hubCardName}>{ins.nombre || "SIN NOMBRE"}</Text><Text style={styles.hubCardDate}>Elab: {ins.f_elab} | Mod: {ins.f_rev}</Text></TouchableOpacity>
          <View style={{flexDirection: 'row', gap: 10}}><TouchableOpacity onPress={(e)=>{e.stopPropagation(); generateAuditPDF(ins);}} style={styles.pdfBtn}><FileText color="#fff" size={22} /></TouchableOpacity><TouchableOpacity onPress={(e)=>{e.stopPropagation(); deleteAudit(ins.firestoreId || ins.id);}} style={styles.deleteBtn}><Trash2 color="#fff" size={22} /></TouchableOpacity></View>
        </View>
      ))}</ScrollView>
    </SafeAreaView></SafeAreaProvider>
  );

  return (
    <SafeAreaProvider><SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Modal visible={modalFotoVisible} transparent animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Pie de Foto</Text>{tempPhotoUri && <Image source={{uri: tempPhotoUri}} style={styles.modalImg} />}<TextInput style={styles.modalInput} placeholder="Evidencia..." value={tempCaption} onChangeText={setTempCaption} autoFocus /><View style={styles.modalActions}><TouchableOpacity style={styles.modalBtnCancel} onPress={()=>setModalFotoVisible(false)}><X color={THEME.textSecondary} size={24} /></TouchableOpacity><TouchableOpacity style={styles.modalBtnOk} onPress={savePhotoWithCaption}><Check color="#fff" size={24} /></TouchableOpacity></View></View></View></Modal>
      <View style={styles.header}><TouchableOpacity onPress={()=>setView('HUB')} style={styles.backBtn}><List color={THEME.text} size={26} /></TouchableOpacity><Text style={styles.headerTitle}>{activeTab}</Text><View style={styles.gpsBadge}><MapPin color={form.gps_real ? THEME.success : '#ccc'} size={24} />{form.gps_real && <Text style={styles.gpsCoords}>{form.gps_real.lat}, {form.gps_real.lng}</Text>}</View></View>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':null} style={{flex:1}}>
          {activeTab === 'DATOS GENERALES' && renderGeneral()}
          {activeTab === 'CONTACTOS' && renderContactos()}
          {activeTab === 'CAPACIDADES' && renderCapacidades()}
          {activeTab === 'LOGISTICA' && renderLogistica()}
          {activeTab === 'SERVICIOS' && renderServicios()}
          {activeTab === 'CONTROL' && renderControl()}
      </KeyboardAvoidingView>
      <View style={styles.footer}><View style={styles.navBar}><NavTab id="DATOS GENERALES" label="General" icon={Info} active={activeTab} set={setActiveTab} /><NavTab id="CONTACTOS" label="Contactos" icon={Users} active={activeTab} set={setActiveTab} /><NavTab id="CAPACIDADES" label="Capacidad" icon={Activity} active={activeTab} set={setActiveTab} /><NavTab id="LOGISTICA" label="Logística" icon={MapIcon} active={activeTab} set={setActiveTab} /><NavTab id="SERVICIOS" label="Servicios" icon={Zap} active={activeTab} set={setActiveTab} /><NavTab id="CONTROL" label="Control" icon={Settings} active={activeTab} set={setActiveTab} /></View><View style={styles.actionBar}><Action icon={Camera} label="FOTO" color={THEME.info} onPress={takePhoto} /><Action icon={form.gps_real?Lock:MapPin} label={form.gps_real?"GPS FIJADO":"GPS"} color={form.gps_real?THEME.textSecondary:THEME.accent} onPress={captureLocation} /><Action icon={Cloud} label="GUARDAR" color={THEME.success} onPress={syncToCloud} /></View></View>
      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={THEME.accent} /></View>}
    </SafeAreaView></SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  hubHeader: { height: 120, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingTop: 30, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: THEME.border },
  hubTitle: { fontSize: 24, fontWeight: '900', marginLeft: 15 },
  hubLogo: { width: 45, height: 45, borderRadius: 10 },
  newBtn: { backgroundColor: THEME.accent, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  newBtnText: { color: '#fff', fontWeight: '900' },
  hubCard: { backgroundColor: '#fff', padding: 20, borderRadius: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: THEME.border },
  hubCardId: { fontSize: 12, color: THEME.accent, fontWeight: '800' },
  hubCardName: { fontSize: 18, fontWeight: '700' },
  hubCardDate: { fontSize: 10, color: '#999', marginTop: 4 },
  pdfBtn: { backgroundColor: THEME.info, padding: 10, borderRadius: 10, marginRight: 10 },
  deleteBtn: { backgroundColor: THEME.danger, padding: 10, borderRadius: 10 },
  header: { height: 120, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: 30, borderBottomWidth: 1, borderBottomColor: THEME.border, justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center' },
  gpsCoords: { fontSize: 11, fontWeight: 'bold', color: THEME.success, marginLeft: 5 },
  formContent: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  gridRow: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  zoneLabel: { width: 35, fontWeight: 'bold', color: THEME.accent, fontSize: 12 },
  totalVal: { width: '13%', textAlign: 'center', fontWeight: '900', color: THEME.info, fontSize: 11 },
  sectionTitle: { width: '100%', fontSize: 18, fontWeight: '900', marginVertical: 15, borderLeftWidth: 5, borderLeftColor: THEME.accent, paddingLeft: 12 },
  subTitle: { width: '100%', fontSize: 14, fontWeight: '800', color: THEME.textSecondary, marginBottom: 5 },
  inputBox: { backgroundColor: '#fff', paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: THEME.border, height: 56, justifyContent: 'center' },
  inputLabel: { fontSize: 8.5, fontWeight: '800', color: THEME.textSecondary, marginBottom: 0, textTransform: 'uppercase' },
  input: { fontSize: 15, fontWeight: '700', color: THEME.text, height: 32, padding: 0, marginTop: -4 },
  toggleBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: THEME.border, height: 56 },
  toggleStatus: { fontSize: 13, fontWeight: '900', color: THEME.text },
  aseoBlock: { width: '100%', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, marginVertical: 10, borderStyle: 'solid', borderWidth: 1, borderColor: '#ddd' },
  aseoTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10, color: THEME.info },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: THEME.border, paddingBottom: 20 },
  navBar: { flexDirection: 'row', justifyContent: 'center', padding: 10 },
  navTab: { width: 105, height: 85, backgroundColor: THEME.bg, borderRadius: 18, justifyContent: 'center', alignItems: 'center', gap: 8, marginRight: 8, borderWidth: 1, borderColor: THEME.border },
  navTabActive: { backgroundColor: '#fff', borderColor: THEME.accent, borderWidth: 2.5 },
  navTabText: { fontSize: 10.5, fontWeight: '800', color: THEME.textSecondary },
  actionBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, height: 70 },
  actionBtn: { flex: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '70%', backgroundColor: '#fff', borderRadius: 25, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  modalImg: { width: '100%', height: 350, borderRadius: 15, marginBottom: 20, objectFit: 'contain' },
  modalInput: { width: '100%', borderBottomWidth: 3, borderColor: THEME.accent, fontSize: 20, padding: 15, marginBottom: 30, textAlign: 'center', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 30 },
  modalBtnCancel: { backgroundColor: '#EEE', width: 80, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalBtnOk: { backgroundColor: THEME.success, width: 120, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 5 },
  smallAdd: { backgroundColor: '#fff', padding: 10, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: THEME.info, justifyContent: 'center', alignItems: 'center' },
  smallRem: { backgroundColor: '#fff', padding: 10, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: THEME.danger, justifyContent: 'center', alignItems: 'center' },
  salaControls: { width: '100%', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: THEME.border, borderStyle: 'dashed' },
  salaControlsTitle: { fontSize: 11, fontWeight: '900', color: THEME.textSecondary }
});