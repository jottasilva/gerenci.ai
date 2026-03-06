import os
import django
from django.utils import timezone
from datetime import timedelta
import sys

# Setup django environment
sys.path.append('d:\\Projetos\\Gerenc.AI\\remix-of-remix-of-remix-of-zappdv-o-chat-que-vende\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from orders.models import Order
from stores.models import Store

def verify_stats_logic():
    now = timezone.localtime(timezone.now())
    today_date = now.date()
    
    # Simulate logic from views.py
    periods = {
        'diario': today_date,
        'semanal': today_date - timedelta(days=7),
        'mensal': today_date - timedelta(days=30)
    }
    
    print(f"Current Date: {today_date}")
    for name, start in periods.items():
        print(f"Period: {name}, Start Date: {start}")
        
    # Test chart logic
    print("\nTesting Monthly Chart Logic:")
    months_br = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    curr_d = today_date.replace(day=1)
    results = []
    for i in range(6):
        d = curr_d
        results.insert(0, f"{months_br[d.month-1]}/{str(d.year)[2:]}")
        # Retroceder um mês corretamente
        prev_month = d - timedelta(days=1)
        curr_d = prev_month.replace(day=1)
    
    print(f"Generated chart months: {results}")
    
    # Assertions
    assert results[-1].startswith(months_br[today_date.month-1]), f"Last month should be current month ({months_br[today_date.month-1]})"
    assert len(results) == 6, "Should generate 6 months"
    # Check if any month is skipped (assuming sequential)
    # This is harder to check automatically without a more complex loop, but visual check is:
    # Mar, Fev, Jan, Dez, Nov, Out
    print("Verification complete (Logic only).")

if __name__ == "__main__":
    verify_stats_logic()
