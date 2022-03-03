@extends('user-profile')
@section('page_styles')
    <link rel="stylesheet" type="text/css" href="{{ asset('css/user-profile.css') }}">
    <link rel="stylesheet" href="{{ asset('css/quotation.css') }}">
@endsection
@section('profile-section')
    ​
    <div id="my-invoices" class="tab-pane user-profile fade">
        <div class="invoice-box">
            <table cellpadding="0" cellspacing="0">
                <tr class="top">
                    <td colspan="6">
                        <table>
                            <tr>
                                <td class="title">
                                    <img src="{{ asset('images/MYNM_Logo.png') }}"
                                        style="width: 100%; max-width: 300px" />
                                </td>
                                <td style="text-align: right">
                                    <strong>Invoice #:</strong> {{ $invoice->id }}<br />
                                    <strong>Date:</strong> {{ $invoice->formatDate() }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ​
                <tr class="information">
                    <td colspan="6">
                        <table>
                            <tr>
                                <td>
                                    Sparksuite, Inc.<br />
                                    12345 Sunny Road<br />
                                    Sunnyville, CA 12345
                                </td>
                                ​
                                <td style="text-align: right">
                                    <strong>Customer Name:</strong>
                                    {{ Auth::user()->first_name . ' ' . Auth::user()->last_name }}<br />
                                    <strong>Customer Email:</strong> {{ Auth::user()->email }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ​
                <tr class="heading">
                    <td>Zone</td>
                    <td>Unit Type</td>
                    <td>Unit ID</td>
                    <td>Unit Price</td>
                    <td>Item Subtotal</td>
                    {{-- <td>Options</td> --}}
                    {{-- <td></td> --}}
                </tr>
                ​
                <tr class="item {{ $loop->last ? 'last' : '' }}">
                    <td>{{ $item->name }}</td>
                    <td>{{ $item->getLineItemPrice() }}</td>
                    <td>{{ $item->qty }}</td>
                    <td>{{ $item->getDiscount() }}</td>
                    <td>{{ $item->getLineItemTotalPrice() }}</td>
                    {{-- <td></td> --}}
                </tr>
                <tr>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                </tr>
                <tr class="total">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    {{-- <td></td> --}}
                    <td>
                        Final Price:
                        <strong>
                            {{ $invoice->getFinalPrice() }}
                        </strong>
                    </td>
                </tr>
            </table>
            <hr>
            <div class="d-flex justify-content-between align-items-center">
                @if ($invoice->status == \App\Models\Quotation::SENT_TO_CUSTOMER)
                    <a target="_blank" class="main-btn black-btn" href="{{ $url }}">
                        Proceed to Payment
                    </a>
                @endif
                <a target="_blank" href="{{ $invoice->generatePdfRoute() }}" class="main-btn white-btn mr-3">
                    <i class="fas fa-receipt"></i> &nbsp;
                    View Invoice PDF
                </a>
                {!! $qr_code !!}
            </div>
        </div>
    </div>
