from django.utils import timezone
from datetime import datetime, time
import json
import os

# Path for store settings (since we cannot alter the DB schema)
SETTINGS_DIR = 'store_data/settings'

def get_store_service_hours(store_id):
    """
    Retrieves service hour settings for a store.
    Returns defaults if no config exists.
    """
    config_path = os.path.join(SETTINGS_DIR, f'hours_{store_id}.json')
    
    # Default settings
    defaults = {
        'horario_inicio': '08:00',
        'horario_fim': '22:00',
        'dias_ativos': [0, 1, 2, 3, 4, 5, 6], # Seg-Dom
        'tolerancia_minutos': 15,
        'permitir_venda_fora_horario': False,
        'exigir_aprovacao_fora_horario': True,
    }
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                saved = json.load(f)
                defaults.update(saved)
        except Exception:
            pass
            
    return defaults

def save_store_service_hours(store_id, config):
    """Saves service hour settings for a store."""
    os.makedirs(SETTINGS_DIR, exist_ok=True)
    config_path = os.path.join(SETTINGS_DIR, f'hours_{store_id}.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)

def get_user_service_hours(whatsapp):
    """
    Retrieves service hour settings for a specific user.
    """
    config_path = os.path.join(SETTINGS_DIR, f'user_hours_{whatsapp}.json')
    
    # Defaults: uses store defaults if not set
    defaults = {
        'horario_inicio': None, # Use store default if None
        'horario_fim': None,
        'dias_ativos': None,
        'ativo': True, # User-specific kill switch
    }
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                saved = json.load(f)
                defaults.update(saved)
        except Exception:
            pass
            
    return defaults

def save_user_service_hours(whatsapp, config):
    """Saves service hour settings for a user."""
    os.makedirs(SETTINGS_DIR, exist_ok=True)
    config_path = os.path.join(SETTINGS_DIR, f'user_hours_{whatsapp}.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)

def is_within_service_hours(store_id, user=None):
    """
    Validates if the current time is within the allowed service hours.
    Checks both Store-level and User-level constraints.
    """
    try:
        store_config = get_store_service_hours(store_id)
        now = timezone.localtime(timezone.now())
        current_time = now.time()
        weekday = now.weekday()

        # 1. User-Level Check (Override)
        if user:
            whatsapp = getattr(user, 'whatsapp', None)
            if whatsapp:
                user_config = get_user_service_hours(whatsapp)
                if not user_config.get('ativo', True):
                    return False, f"Atendente {getattr(user, 'first_name', 'Operador')} está inativo para atendimento."
                    
                u_inicio = user_config.get('horario_inicio')
                u_fim = user_config.get('horario_fim')
                u_dias = user_config.get('dias_ativos')
                
                # If user has specific days, check them
                if u_dias is not None:
                    if weekday not in u_dias:
                        return False, f"Atendente {getattr(user, 'first_name', 'Operador')} não atende neste dia."
                
                # If user has specific hours, check them
                if u_inicio and u_fim:
                    try:
                        start = datetime.strptime(u_inicio, '%H:%M').time()
                        end = datetime.strptime(u_fim, '%H:%M').time()
                        if not (start <= current_time <= end):
                            return False, f"Atendente {getattr(user, 'first_name', 'Operador')} fora do seu horário ({u_inicio} - {u_fim})."
                    except (ValueError, TypeError):
                        pass # Fallback to store hours if format is bad

        # 2. Store-Level Check
        # Day Check
        dias_ativos = store_config.get('dias_ativos', [])
        if not isinstance(dias_ativos, list) or weekday not in dias_ativos:
            return False, "Loja fechada hoje (dia da semana não ativo)."
            
        # Time Check
        h_inicio = store_config.get('horario_inicio', '08:00')
        h_fim = store_config.get('horario_fim', '22:00')
        
        try:
            start_time = datetime.strptime(h_inicio, '%H:%M').time()
            end_time = datetime.strptime(h_fim, '%H:%M').time()
            if not (start_time <= current_time <= end_time):
                if store_config.get('permitir_venda_fora_horario'):
                    return True, "Fora do horário da loja, mas permitido por configuração."
                return False, f"Loja fora do horário permitido ({h_inicio} - {h_fim})."
        except (ValueError, TypeError):
            return True, "Configuração de horário da loja inválida, permitindo."
            
        return True, "Dentro do horário."
    except Exception as e:
        # Fallback to allow sale if logic crashes
        print(f"CRITICAL ERROR in is_within_service_hours: {e}")
        return True, f"Erro interno na validação de horário: {e}"
