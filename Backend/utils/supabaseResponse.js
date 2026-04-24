const getSupabaseStatus = (error) => (error.code === 'PGRST116' ? 404 : 400);

const sendSupabaseResult = (res, { data, error }, successStatus = 200) => {
  if (error) {
    return res.status(getSupabaseStatus(error)).json({ error: error.message, code: error.code });
  }

  return res.status(successStatus).json(data);
};

module.exports = { sendSupabaseResult };
