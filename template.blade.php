@extends('user-profile')
@section('page_styles')
    <link rel="stylesheet" type="text/css" href="{{ asset('css/user-profile.css') }}">
    <link rel="stylesheet" href="{{ asset('css/quotation.css') }}">
@endsection
@section('profile-section')
    ​
    <div id="my-invoices" class="tab-pane user-profile fade">
        @if ($errors->any())
            <div class="alert alert-danger">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        @if (session('update'))
            <br>
            <br>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>{{ __('messages.success') }}! </strong> {{ session('update') }}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        @endif
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
            {{-- <form action="{{route('quotation-status-update',$quotation->id)}}" method="POST">
      @method('PUT')
      @csrf
      <div class="form-group">
        <input type="checkbox" name="agree" id="agree">
        <label for="agree">I hereby agree on the quotation and agreed on the vehicle condition in the report!</label>
      </div>
      <div class="update-quotation-status d-flex">
        @if ($quotation->status == 2)
          <button type="submit" id="reject-btn" class="main-btn white-btn w-100" value="1" name="status">
            Reject Quotation
          </button>
        @elseif ($quotation->status == 1)
          <button type="submit" class="main-btn black-btn w-100" value="2" name="status">
            Accept Quotation
          </button>
        @else
          <button type="submit" id="reject-btn" class="main-btn white-btn w-100" value="1" name="status">
            Reject Quotation
          </button>
          <button type="submit" class="main-btn black-btn w-100" value="2" name="status">
            Accept Quotation
          </button>
        @endif
      </div>
    </form> --}}
        </div>
    </div>
@endsection
@section('profile-scripts')
    @if ($invoice->status == \App\Models\Quotation::SENT_TO_CUSTOMER)
        <script>
            document.querySelector('.dues-link').classList.add('active')
        </script>
    @elseif ($invoice->status != \App\Models\Quotation::SENT_TO_CUSTOMER)
        <script>
            document.querySelector('.invoices-link').classList.add('active')
        </script>
    @endif
    <script src="{{ asset('js/customer-quotation.js') }}"></script>
@endsection
