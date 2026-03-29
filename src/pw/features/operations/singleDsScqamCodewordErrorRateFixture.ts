import type { DsScqamCodewordErrorRateResponse } from "@/types/api";

export const singleDsScqamCodewordErrorRateFixture: DsScqamCodewordErrorRateResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Successfully retrieved codeword error rate",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "CM8200A",
    HW_REV: "3",
    SW_REV: "9.1.103",
    BOOTR: "2.4.18",
  },
  results: [
    {
      index: 52,
      channel_id: 17,
      codeword_totals: {
        total_codewords: 1843200,
        total_errors: 4,
        time_elapsed: 5,
        error_rate: 0.0000021701388889,
        codewords_per_second: 368640,
        errors_per_second: 0.8,
      },
    },
    {
      index: 53,
      channel_id: 30,
      codeword_totals: {
        total_codewords: 1926400,
        total_errors: 7,
        time_elapsed: 5,
        error_rate: 0.0000036337219731,
        codewords_per_second: 385280,
        errors_per_second: 1.4,
      },
    },
    {
      index: 54,
      channel_id: 31,
      codeword_totals: {
        total_codewords: 1881600,
        total_errors: 3,
        time_elapsed: 5,
        error_rate: 0.0000015943877551,
        codewords_per_second: 376320,
        errors_per_second: 0.6,
      },
    },
    {
      index: 55,
      channel_id: 32,
      codeword_totals: {
        total_codewords: 1900800,
        total_errors: 5,
        time_elapsed: 5,
        error_rate: 0.0000026301939058,
        codewords_per_second: 380160,
        errors_per_second: 1,
      },
    },
  ],
};
