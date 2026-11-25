// Load @supabase/supabase-js@2 via CDN in each page that includes this script.
const SUPABASE_URL = 'PASTE_YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'sb_publishable_feXccs1SZRpgND6SqPihyw_lNEHnjTI';

let supabase = null;

try {
  const urlIsConfigured = SUPABASE_URL !== 'PASTE_YOUR_PROJECT_URL_HERE' && /^https?:\/\//i.test(SUPABASE_URL);
  if (typeof window.supabase !== 'undefined' && urlIsConfigured && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.info('Supabase is not configured; this site remains fully functional.', error);
}

async function incrementProcessedFile() {
  if (!supabase) return false;
  try {
    const { data, error: readError } = await supabase
      .from('utility_tool_stats')
      .select('total_uses')
      .eq('id', 1)
      .maybeSingle();
    if (readError) throw readError;

    const nextTotal = (data?.total_uses || 1250) + 1;
    const { error: updateError } = await supabase
      .from('utility_tool_stats')
      .update({ total_uses: nextTotal })
      .eq('id', 1);
    if (updateError) throw updateError;

    const counter = document.querySelector('[data-global-counter]');
    if (counter) counter.textContent = nextTotal.toLocaleString();
    return true;
  } catch (error) {
    console.info('Usage counter update is unavailable.', error);
    return false;
  }
}

async function loadGlobalCounter() {
  const counter = document.querySelector('[data-global-counter]');
  if (!counter) return;
  if (!supabase) {
    counter.textContent = '1250';
    return;
  }
  try {
    const { data, error } = await supabase
      .from('utility_tool_stats')
      .select('total_uses')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    counter.textContent = (data?.total_uses || 1250).toLocaleString();
  } catch (error) {
    counter.textContent = '1250';
  }
}

async function submitToolRequest(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const status = form.querySelector('.request-status');
  const formData = new FormData(form);
  const toolName = formData.get('tool_name')?.trim();

  if (!toolName) {
    if (status) status.textContent = 'Please enter the tool you would like.';
    return;
  }
  if (!supabase) {
    if (status) status.textContent = 'Thanks! Configure Supabase to save requests publicly.';
    form.reset();
    return;
  }
  try {
    const { error } = await supabase
      .from('utility_tool_requests')
      .insert([{ tool_name: toolName }]);
    if (error) throw error;
    if (status) status.textContent = 'Thank you — your request has been saved!';
    form.reset();
  } catch (error) {
    if (status) status.textContent = 'We could not save the request. Please try again later.';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadGlobalCounter();
  document.querySelectorAll('[data-tool-request-form]').forEach(form => form.addEventListener('submit', submitToolRequest));
});
