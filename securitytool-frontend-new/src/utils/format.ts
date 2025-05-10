// src/utils/format.ts

/**
 * Format một chuỗi ISO date hoặc đối tượng Date thành chuỗi theo locale.
 * @param input ISO date string hoặc Date
 * @param locale mã địa phương, mặc định 'en-US'
 * @param options các tuỳ chọn Intl.DateTimeFormat
 */
export function formatDate(
    input: string | Date,
    locale = 'en-US',
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ): string {
    const date = typeof input === 'string' ? new Date(input) : input;
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  
  /**
   * Chuyển number thành chuỗi phân cách hàng nghìn.
   * @param value số cần định dạng
   */
  export function formatNumber(value: number): string {
    return value.toLocaleString();
  }
  
  /**
   * Format một số thành chuỗi tiền tệ.
   * @param value số
   * @param locale locale (ví dụ 'en-US', 'vi-VN')
   * @param currency mã tiền tệ (ví dụ 'USD', 'VND')
   */
  export function formatCurrency(
    value: number,
    locale = 'en-US',
    currency: string = 'USD'
  ): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  }
  
  /**
   * Viết hoa ký tự đầu chuỗi.
   * @param text chuỗi gốc
   */
  export function capitalize(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  /**
   * Chuyển object thành JSON string đẹp, tiện in ra màn hình/log.
   * @param obj bất kỳ object nào
   */
  export function formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
  